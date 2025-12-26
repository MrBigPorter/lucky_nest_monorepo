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
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { UploadService } from '@api/common/upload/upload.service';

// 定义统一的返回接口
export interface IdCardResult {
  type:
    | 'PASSPORT'
    | 'PH_DRIVER_LICENSE'
    | 'PH_UMID'
    | 'PH_NATIONAL_ID'
    | 'CN_ID'
    | 'VN_ID'
    | 'UNKNOWN';
  country: string; // 'Global', 'PH', 'CN', 'VN'
  idNumber: string | null;
  name: string | null;
  rawText: string;
}

@Injectable()
export class KycProviderService {
  private readonly logger = new Logger(KycProviderService.name);

  // AWS Rekognition client
  private rekognitionClient: RekognitionClient;
  private readonly livenessPassScore: number;
  private readonly faceMatchScore: number;

  // Google Vision client
  private googleVisionClient?: ImageAnnotatorClient;

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

    // --- 2. Google Cloud Vision 初始化 ---
    // 安全做法：从环境变量读取 JSON 字符串并解析
    const googleCredsRaw = this.configService.get<string>(
      'GOOGLE_VISION_CREDENTIALS',
    );
    if (googleCredsRaw) {
      try {
        const credentials = JSON.parse(googleCredsRaw);
        this.googleVisionClient = new ImageAnnotatorClient({
          credentials,
        });
        this.logger.log('Google Cloud Vision Client initialized successfully');
      } catch (e) {
        this.logger.error('Failed to parse GOOGLE_VISION_CREDENTIALS', e);
      }
    } else {
      this.logger.warn(' GOOGLE_VISION_CREDENTIALS not found, OCR will fail');
    }
  }

  /**
   * Create a liveness detection session
   * @param clientRequestToken
   */
  async createLivenessSession(
    clientRequestToken: string,
  ): Promise<{ sessionId: string | undefined } | undefined> {
    try {
      const command = new CreateFaceLivenessSessionCommand({
        // 幂等性 Token，防止短时间内重复创建扣费
        ClientRequestToken: clientRequestToken,
        Settings: {
          AuditImagesLimit: 1, // 最多保存一张审核图片
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
   * @param userId
   * @param sessionId
   * @param idCardKey
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

      // get liveness results
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

      // compare face from liveness with ID card
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
      // get id card image from R2
      this.logger.log('fetching ID card image from URL');
      // 2. 直接从 R2 读取证件照 (比 Axios 更稳)
      const idCardImage = await this.uploadService.getFileBuffer(
        idCardKey,
        'kyc',
        userId,
      );
      // compare faces
      const compareCommand = new CompareFacesCommand({
        SourceImage: { Bytes: livenessImage },
        TargetImage: { Bytes: idCardImage },
        SimilarityThreshold: this.faceMatchScore,
      });

      // send compare command
      const compareResponse = await this.rekognitionClient.send(compareCommand);
      const faceMatches = compareResponse.FaceMatches || [];
      const similarity = faceMatches[0]?.Similarity ?? 0;

      const isSamePerson =
        faceMatches.length > 0 && similarity! >= this.faceMatchScore;

      this.logger.log('liveness and ID card matching completed');

      return {
        success: true,
        passed: isSamePerson, // only pass if both liveness and face match
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

  /**
   * 🌏 国际化 OCR 核心入口
   */
  async ocrIdCard(userId: string, idCardKey: string): Promise<IdCardResult> {
    if (!this.googleVisionClient) {
      throw new InternalServerErrorException(
        'Google Vision Client not configured',
      );
    }

    try {
      this.logger.log(`Starting OCR for user: ${userId}`);

      // 1. 复用 UploadService 获取图片 Buffer
      const imageBuffer = await this.uploadService.getFileBuffer(
        idCardKey,
        'kyc',
        userId,
      );

      // 2. 调用 Google Vision OCR API
      const [result] = await this.googleVisionClient.textDetection({
        image: { content: imageBuffer },
        imageContext: {
          // 国际化关键：提示可能包含中、英、菲、越、泰语
          languageHints: ['en', 'zh', 'fil', 'vi', 'th'],
        },
      });
      const fullText = result.fullTextAnnotation?.text || '';

      // 仅打印前50字符预览，防止日志过大
      this.logger.debug(
        `OCR Raw Text Preview: ${fullText.substring(0, 50).replace(/\n/g, ' ')}...`,
      );

      // 3. 策略模式：依次尝试不同的解析器
      const parsers = [
        this.parsePassportMRZ, // 1. 护照 (最准)
        this.parsePhilippinesID, // 2. 菲律宾本地 ID
        this.parseChineseId, // 3. 中国身份证
        this.parseVietnamId, // 4. 越南身份证
      ];

      for (const parser of parsers) {
        // 注意：这里必须用 call(this) 绑定上下文
        const result = parser.call(this, fullText);
        if (result) {
          this.logger.log(`✅ Matched ID Type: ${result.type}`);
          return { ...result, rawText: fullText };
        }
      }

      // 4. 兜底：未匹配到特定类型
      return {
        type: 'UNKNOWN',
        country: 'UNKNOWN',
        idNumber: this.extractGenericNumber(fullText),
        name: null,
        rawText: fullText,
      };
    } catch (error) {
      this.logger.error('Google Vision OCR Error', error);
      throw new InternalServerErrorException(
        'could not perform OCR on ID card',
      );
    }
  }

  // ======================================================
  //  国际化解析策略 (Strategy Implementations)
  // ======================================================

  /**
   * 策略 1: 国际护照 (Passport MRZ)
   */
  private parsePassportMRZ(text: string): Omit<IdCardResult, 'rawText'> | null {
    if (!text.includes('P<') || !text.includes('<<')) return null;

    const lines = text.split('\n').map((l) => l.replace(/\s/g, ''));
    let surname = '',
      givenName = '',
      docNumber = '',
      country = 'Global';

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];

      // 姓名行: P<PHLDOE<<JOHN<<<<
      if (line.startsWith('P<')) {
        const parts = line.split('<<');
        country = line.substring(2, 5);
        surname = parts[0].substring(5).replace(/</g, '');
        givenName = parts[1] ? parts[1].replace(/</g, '') : '';
      }
      // 号码行
      else if (
        /[A-Z0-9]/.test(line) &&
        line.length > 20 &&
        line.includes('<')
      ) {
        const match = line.match(/^([A-Z0-9]+)</);
        if (match) docNumber = match[1];
      }
    }

    if (docNumber) {
      return {
        type: 'PASSPORT',
        country: country,
        idNumber: docNumber,
        name: `${givenName} ${surname}`.trim(),
      };
    }
    return null;
  }

  /**
   * 策略 2: 菲律宾证件
   */
  private parsePhilippinesID(
    text: string,
  ): Omit<IdCardResult, 'rawText'> | null {
    // A. Driver's License
    const dlRegex = /([A-Z]\d{2}-\d{2}-\d{6})/;
    const dlMatch = text.match(dlRegex);
    if (dlMatch) {
      return {
        type: 'PH_DRIVER_LICENSE',
        country: 'PH',
        idNumber: dlMatch[0],
        name: null,
      };
    }

    // B. UMID
    const umidRegex = /\b(\d{4}[-\s]?\d{7}[-\s]?\d{1})\b/;
    const umidMatch = text.match(umidRegex);
    if (umidMatch && (text.includes('UMID') || text.includes('CRN'))) {
      return {
        type: 'PH_UMID',
        country: 'PH',
        idNumber: umidMatch[1].replace(/[-\s]/g, ''),
        name: null,
      };
    }

    // C. PhilSys / National ID
    if (text.includes('PhilSys') || text.includes('PhilID')) {
      const psnMatch = text.match(
        /\b(\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4})\b/,
      );
      if (psnMatch) {
        return {
          type: 'PH_NATIONAL_ID',
          country: 'PH',
          idNumber: psnMatch[1].replace(/[-\s]/g, ''),
          name: null,
        };
      }
    }
    return null;
  }

  /**
   * 策略 3: 中国身份证
   */
  private parseChineseId(text: string): Omit<IdCardResult, 'rawText'> | null {
    if (/居民身份证|公民身份/.test(text) || /\d{17}[\dXx]/.test(text)) {
      const idMatch = text.match(/\d{17}[\dXx]/);
      const nameMatch = text.match(/姓名\s*([\u4e00-\u9fa5]{2,10})/);

      return {
        type: 'CN_ID',
        country: 'CN',
        idNumber: idMatch ? idMatch[0] : null,
        name: nameMatch ? nameMatch[1] : null,
      };
    }
    return null;
  }

  /**
   * 策略 4: 越南身份证
   */
  private parseVietnamId(text: string): Omit<IdCardResult, 'rawText'> | null {
    if (text.includes('Căn cước') || text.includes('SOCIALIST REPUBLIC')) {
      const vnIdMatch = text.match(/\b\d{12}\b/);
      if (vnIdMatch) {
        return {
          type: 'VN_ID',
          country: 'VN',
          idNumber: vnIdMatch[0],
          name: null,
        };
      }
    }
    return null;
  }

  /**
   * 辅助: 兜底提取数字
   */
  private extractGenericNumber(text: string): string | null {
    const matches = text.match(/\b[A-Z0-9-]{7,20}\b/g);
    if (!matches) return null;
    return matches.sort((a, b) => b.length - a.length)[0];
  }
}
