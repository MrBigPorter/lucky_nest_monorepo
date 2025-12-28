import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RekognitionClient,
  CreateFaceLivenessSessionCommand,
  GetFaceLivenessSessionResultsCommand,
  CompareFacesCommand,
} from '@aws-sdk/client-rekognition';
import {
  VertexAI,
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from '@google-cloud/vertexai';
// UploadService 仅用于兼容旧方法，核心逻辑不需要它了
import { UploadService } from '@api/common/upload/upload.service';

// 定义统一的返回接口
export interface IdCardResult {
  type:
    | 'PASSPORT'
    | 'PH_DRIVER_LICENSE'
    | 'PH_UMID'
    | 'PH_NATIONAL_ID'
    | 'PH_ACR'
    | 'CN_ID'
    | 'VN_ID'
    | 'UNKNOWN';
  country: string;
  idNumber: string | null;
  name: string | null;
  gender: string | null;
  birthday: string | null;
  expiryDate?: string | null;
  // 新增：伪造检测字段
  isSuspicious: boolean; // 是否可疑
  fraudScore: number; // 欺诈分 0-100 (分数越高越假)
  fraudReason: string | null; // 具体理由 (例如: "Detected screen moiré patterns", "Black and white photocopy")
  rawText?: string;
}

@Injectable()
export class KycProviderService {
  private readonly logger = new Logger(KycProviderService.name);

  // AWS Rekognition client
  private rekognitionClient: RekognitionClient;
  private readonly livenessPassScore: number;
  private readonly faceMatchScore: number;

  // Vertex AI (Gemini)
  private vertexAI?: VertexAI;
  private geminiModel?: GenerativeModel;

  constructor(
    private configService: ConfigService,
    private uploadService: UploadService,
  ) {
    // --- 1. AWS Rekognition 初始化 ---
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    this.livenessPassScore = Number(
      this.configService.get<string>('KYC_LIVENESS_PASS_SCORE', '85'),
    );
    this.faceMatchScore = Number(
      this.configService.get<string>('KYC_FACE_MATCH_SCORE', '90'),
    );

    this.rekognitionClient = new RekognitionClient({
      region,
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });

    // --- 2. Vertex AI 初始化 ---
    const googleCredsRaw = this.configService.get<string>(
      'GOOGLE_VISION_CREDENTIALS',
    );
    if (googleCredsRaw) {
      try {
        const credentials = JSON.parse(googleCredsRaw);
        const projectId =
          credentials.project_id || this.configService.get('GOOGLE_PROJECT_ID');

        if (projectId) {
          this.vertexAI = new VertexAI({
            project: projectId,
            location: 'us-central1',
            googleAuthOptions: { credentials },
          });

          this.geminiModel = this.vertexAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            safetySettings: [
              {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE,
              },
              {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
              },
              {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
              }, // 关键：防止误判证件照
              {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
              },
            ],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 2048,
              responseMimeType: 'application/json',
            },
          });
          this.logger.log(`Vertex AI initialized: ${projectId}`);
        }
      } catch (e) {
        this.logger.error('Failed to parse GOOGLE_VISION_CREDENTIALS', e);
      }
    }
  }

  /**
   * 新版 OCR: 直接接收 Buffer
   * 适用于：前端上传瞬间的实时识别
   */
  async ocrIdCardByBuffer(imageBuffer: Buffer): Promise<IdCardResult> {
    if (!this.geminiModel) {
      throw new InternalServerErrorException('Vertex AI Client not configured');
    }

    try {
      // 直接调 AI，省去下载
      const result = await this.extractWithGemini(imageBuffer);

      if (result) {
        this.logger.log(`Gemini Extraction Success: [${result.type}]`);
        return result;
      } else {
        return {
          type: 'UNKNOWN',
          country: 'UNKNOWN',
          idNumber: null,
          name: null,
          birthday: null,
          gender: null,
          isSuspicious: false,
          fraudScore: 0,
          fraudReason: null,
          rawText: '',
        };
      }
    } catch (error) {
      this.logger.error('Gemini OCR Process Error', error);
      throw new InternalServerErrorException(
        'could not perform OCR on ID card',
      );
    }
  }

  /**
   *  旧版兼容 OCR: 通过 Key 下载
   * 适用于：修复旧数据，或后台管理员手动触发重扫
   */
  async ocrIdCardByKey(
    userId: string,
    idCardKey: string,
  ): Promise<IdCardResult> {
    const buffer = await this.uploadService.getFileBuffer(
      idCardKey,
      'kyc',
      userId,
    );
    return this.ocrIdCardByBuffer(buffer);
  }

  /**
   * Gemini 核心提取逻辑 (升级版：加入反欺诈指令)
   */
  private async extractWithGemini(
    imageBuffer: Buffer,
  ): Promise<IdCardResult | null> {
    if (!this.geminiModel) return null;

    // 升级后的 Prompt：加入 "Anti-Spoofing" 和 "Forensics" 指令
    const prompt = `
      Act as a KYC Security Expert. Analyze this ID card image for OCR and FRAUD detection.
      Output STRICT JSON.
      
      Part 1: Extraction
      1. "type": Identify ID type (PH_DRIVER_LICENSE, PASSPORT, etc. or UNKNOWN).
      2. "country": PH, CN, VN, or Global.
      3. "idNumber": Remove spaces/dashes.
      4. "name": Full Name.
      5. "birthday": YYYY-MM-DD.
      6. "gender": MALE/FEMALE.
      7. "expiryDate": YYYY-MM-DD.

      Part 2: Forgery & Liveness Analysis (CRITICAL)
      Analyze the image for signs of digital manipulation or spoofing. Check for:
      - Screen Recapture: Look for Moiré patterns (wavy lines), pixel grids, or screen glare.
      - Digital Fake: Look for perfectly flat colors, unnatural text alignment (Photoshop), or lack of depth.
      - Photocopy: Is it black and white or low contrast?
      - Cropping: Are edges cut off unnaturally?
      
      Based on this, add these fields:
      8. "isSuspicious": boolean (true if any sign of fake/screen/photocopy is found).
      9. "fraudScore": number (0-100). 0 = Real physical card, 100 = Obvious fake/screen.
      10. "fraudReason": string (e.g., "Photo of a digital screen detected", "Mismatched fonts", "Black and white photocopy"). If safe, return null.

      IMPORTANT: Return ONLY valid JSON.
    `;

    try {
      const result = await this.geminiModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBuffer.toString('base64'),
                },
              },
            ],
          },
        ],
      });

      const response = await result.response;
      let text = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) return null;

      let cleanJson = text.replace(/```json|```/g, '').trim();
      if (!cleanJson.endsWith('}') && cleanJson.includes('{')) {
        cleanJson += '}';
      }

      try {
        const data = JSON.parse(cleanJson);

        // 简单的后处理，防止 AI 幻觉返回空对象
        const isSuspicious = data.isSuspicious === true || data.fraudScore > 50;

        return {
          type: data.type || 'UNKNOWN',
          country: data.country || 'UNKNOWN',
          idNumber: data.idNumber || null,
          name: data.name || null,
          birthday: data.birthday || null,
          gender: data.gender || 'UNKNOWN',
          expiryDate: data.expiryDate || null,

          //  映射新增的风控字段
          isSuspicious: isSuspicious,
          fraudScore: typeof data.fraudScore === 'number' ? data.fraudScore : 0,
          fraudReason:
            data.fraudReason ||
            (isSuspicious ? 'Unknown suspicious artifact' : null),

          rawText: 'Extracted by Gemini AI (2.5-flash) with Fraud Check',
        };
      } catch (parseError) {
        this.logger.error(`JSON Parse Failed: ${text}`);
        // 如果解析失败，可能是图片太糊导致 AI 乱说话，建议视为可疑
        return {
          type: 'UNKNOWN',
          country: 'UNKNOWN',
          idNumber: null,
          name: null,
          birthday: null,
          gender: null,
          isSuspicious: true,
          fraudScore: 80,
          fraudReason: 'AI Parsing Failed (Image likely poor quality)',
        } as IdCardResult;
      }
    } catch (e) {
      this.logger.error('Vertex AI Error', e);
      return null;
    }
  }

  async createLivenessSession(
    userId: string,
  ): Promise<{ sessionId: string | undefined }> {
    // 注意：AWS 这里的入参通常是 clientRequestToken，可以用 userId 或者 uuid
    const clientRequestToken = userId;

    try {
      const command = new CreateFaceLivenessSessionCommand({
        ClientRequestToken: clientRequestToken,
        Settings: { AuditImagesLimit: 1 },
      });
      const response = await this.rekognitionClient.send(command);
      return { sessionId: response.SessionId };
    } catch (error: any) {
      this.logger.error('AWS CreateSession Error', error);
      throw new InternalServerErrorException(
        'could not create liveness session',
      );
    }
  }

  /**
   *  新版活体比对: 直接接收 Buffer
   */
  async verifyLivenessAndMatchIdCard(
    userId: string,
    sessionId: string,
    idCardBuffer: Buffer, // <--- 关键修改：直接传 Buffer
  ): Promise<{
    success: boolean;
    passed: boolean;
    reason: string | null;
    livenessConfidence: number;
    faceSimilarity: number | null;
    referenceImageBytes?: Uint8Array;
  }> {
    try {
      // 1. 获取活体结果
      const livenessCommand = new GetFaceLivenessSessionResultsCommand({
        SessionId: sessionId,
      });
      const livenessResponse =
        await this.rekognitionClient.send(livenessCommand);

      const confidence = livenessResponse.Confidence || 0;
      if (confidence < this.livenessPassScore) {
        return {
          success: true,
          passed: false,
          livenessConfidence: confidence,
          faceSimilarity: null,
          reason: 'Liveness check failed (Low Confidence)',
        };
      }

      const livenessImage = livenessResponse.ReferenceImage?.Bytes;
      if (!livenessImage) {
        return {
          success: false,
          passed: false,
          livenessConfidence: confidence,
          faceSimilarity: null,
          reason: 'Liveness check failed (No Reference Image)',
        };
      }

      // 2. 人证比对 (Source: 活体截图, Target: 用户上传的 Buffer)
      // 注意：不再调用 uploadService.getFileBuffer，直接用 idCardBuffer
      const compareCommand = new CompareFacesCommand({
        SourceImage: { Bytes: livenessImage },
        TargetImage: { Bytes: idCardBuffer }, // <--- 直接使用内存 Buffer
        SimilarityThreshold: this.faceMatchScore,
      });

      const compareResponse = await this.rekognitionClient.send(compareCommand);
      const faceMatches = compareResponse.FaceMatches || [];
      const similarity = faceMatches[0]?.Similarity ?? 0;

      const isSamePerson =
        faceMatches.length > 0 && similarity >= this.faceMatchScore;

      return {
        success: true,
        passed: isSamePerson,
        livenessConfidence: confidence,
        faceSimilarity: isSamePerson ? similarity : 0,
        reason: isSamePerson
          ? null
          : `Face mismatch (${similarity.toFixed(1)}% < ${this.faceMatchScore}%)`,
        referenceImageBytes: livenessImage,
      };
    } catch (error: any) {
      this.logger.error('AWS Liveness Verification Error', error);
      throw new InternalServerErrorException('Verification failed');
    }
  }
}
