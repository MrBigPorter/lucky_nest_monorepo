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
// 1. 引入 Vertex AI
import {
  VertexAI,
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from '@google-cloud/vertexai';
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
  country: string; // 'Global', 'PH', 'CN', 'VN'
  idNumber: string | null;
  name: string | null;
  rawText?: string; // AI 提取不需要 rawText，但为了兼容接口保留
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

    // Initialize AWS Rekognition client
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

        console.log('Google Credentials loaded:', {
          project_id: credentials.project_id,
          client_email: credentials.client_email,
        });
        // 自动从凭证读取 Project ID
        const projectId =
          credentials.project_id || this.configService.get('GOOGLE_PROJECT_ID');

        if (projectId) {
          this.vertexAI = new VertexAI({
            project: projectId,
            location: 'us-central1', // 既然你在菲律宾/亚洲业务，选新加坡节点延迟最低
            googleAuthOptions: { credentials },
          });

          this.geminiModel = this.vertexAI.getGenerativeModel({
            model: 'gemini-2.5-flash', // Flash 版本：极速、便宜
            // 新增安全设置：防止证件照因为“甚至”或“医疗”等原因被 AI 拦截
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
              },
              {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
              },
            ],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 512,
              responseMimeType: 'application/json',
            },
          });
          this.logger.log(
            `Vertex AI (Gemini) initialized for Project: ${projectId}`,
          );
        }
      } catch (e) {
        this.logger.error('Failed to parse GOOGLE_VISION_CREDENTIALS', e);
      }
    } else {
      this.logger.warn('GOOGLE_VISION_CREDENTIALS not found, OCR will fail');
    }
  }

  /**
   *  全新 OCR 核心入口 (纯 Gemini 版)
   */
  async ocrIdCard(userId: string, idCardKey: string): Promise<IdCardResult> {
    if (!this.geminiModel) {
      throw new InternalServerErrorException('Vertex AI Client not configured');
    }

    try {
      this.logger.log(`Starting Gemini OCR for user: ${userId}`);

      // 1. 获取图片
      const imageBuffer = await this.uploadService.getFileBuffer(
        idCardKey,
        'kyc',
        userId,
      );

      // 2. 直接调用 AI 提取
      const result = await this.extractWithGemini(imageBuffer);

      if (result) {
        this.logger.log(
          ` Gemini Extraction Success: [${result.type}] ${result.name} - ${result.idNumber}`,
        );
        return result;
      } else {
        // AI 无法识别 (可能是图片太模糊或非证件)
        this.logger.warn('Gemini returned null result');
        return {
          type: 'UNKNOWN',
          country: 'UNKNOWN',
          idNumber: null,
          name: null,
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
   *  Gemini 核心提取逻辑
   */
  private async extractWithGemini(
    imageBuffer: Buffer,
  ): Promise<IdCardResult | null> {
    if (!this.geminiModel) return null;

    // Prompt: 明确告诉 AI 我们支持哪些证件，以及如何纠错
    const prompt = `
      Analyze this ID card image and extract information into a strict JSON format.
      
      Supported Document Types:
      - PH_ACR (Alien Certificate of Registration / I-Card)
      - PH_DRIVER_LICENSE (Philippines Driver License)
      - PH_UMID (Unified Multi-Purpose ID)
      - PH_NATIONAL_ID (PhilSys / PhilID)
      - PASSPORT (Any country passport)
      - CN_ID (Chinese Resident Identity Card)
      - VN_ID (Vietnamese ID)
      
      Instructions:
      1. Identify the "type" from the list above. If unsure, use "UNKNOWN".
      2. Identify the "country" code (PH, CN, VN, or Global).
      3. Extract "idNumber". Remove spaces inside the number (e.g., "2110 123" -> "2110123").
      4. Extract "name" (Full Name). 
         - CRITICAL: Correct OCR typos based on context (e.g., if you see "Suame: WEI", recognize it as "Surname" and extract "WEI").
         - Combine Surname and Given Name naturally.
      
      Output JSON Format:
      {
        "type": "Enum Value",
        "country": "Code",
        "idNumber": "String",
        "name": "String"
      }
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
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        // 清洗 JSON：防止 AI 偶尔带上 markdown 代码块标记
        const cleanJson = text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleanJson);

        return {
          type: data.type || 'UNKNOWN',
          country: data.country || 'UNKNOWN',
          idNumber: data.idNumber || null,
          name: data.name || null,
          rawText: 'Extracted by Gemini AI', // 占位符
        };
      }
    } catch (e) {
      this.logger.error('Vertex AI API Call Failed', e);
    }
    return null;
  }

  /**
   * Create a liveness detection session
   */
  async createLivenessSession(
    clientRequestToken: string,
  ): Promise<{ sessionId: string | undefined } | undefined> {
    try {
      const command = new CreateFaceLivenessSessionCommand({
        ClientRequestToken: clientRequestToken,
        Settings: {
          AuditImagesLimit: 1,
        },
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
   * Verify liveness and match with ID card
   */
  async verifyLivenessAndMatchIdCard(
    userId: string,
    sessionId: string,
    idCardKey: string,
  ): Promise<{
    success: boolean;
    passed: boolean;
    reason: string | null;
    livenessConfidence: number;
    faceSimilarity: number | null;
    referenceImageBytes?: Uint8Array;
  }> {
    try {
      this.logger.log('start to verify liveness and match ID card');

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
          reason:
            'low confidence in liveness detection, may not be a real person',
        };
      }

      const livenessImage = livenessResponse.ReferenceImage?.Bytes;
      if (!livenessImage) {
        return {
          success: false,
          passed: false,
          livenessConfidence: confidence,
          faceSimilarity: null,
          reason: 'no reference image from liveness detection',
        };
      }

      this.logger.log('fetching ID card image from R2');
      const idCardImage = await this.uploadService.getFileBuffer(
        idCardKey,
        'kyc',
        userId,
      );

      const compareCommand = new CompareFacesCommand({
        SourceImage: { Bytes: livenessImage },
        TargetImage: { Bytes: idCardImage },
        SimilarityThreshold: this.faceMatchScore,
      });

      const compareResponse = await this.rekognitionClient.send(compareCommand);
      const faceMatches = compareResponse.FaceMatches || [];
      const similarity = faceMatches[0]?.Similarity ?? 0;

      const isSamePerson =
        faceMatches.length > 0 && similarity! >= this.faceMatchScore;

      this.logger.log('liveness and ID card matching completed');

      return {
        success: true,
        passed: isSamePerson,
        livenessConfidence: confidence,
        faceSimilarity: isSamePerson ? similarity : 0,
        reason: isSamePerson ? null : 'face does not match ID card',
        referenceImageBytes: livenessImage,
      };
    } catch (error: any) {
      this.logger.error('AWS Liveness Verification Error', error);
      throw new InternalServerErrorException(
        'could not verify liveness and match ID card',
      );
    }
  }
}
