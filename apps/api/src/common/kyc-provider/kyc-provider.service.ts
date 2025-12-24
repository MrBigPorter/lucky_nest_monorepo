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
import { UploadService } from '@api/common/upload/upload.service';
import { randomUUID } from 'node:crypto';

@Injectable()
export class KycProviderService {
  private readonly logger = new Logger(KycProviderService.name);
  private rekognitionClient: RekognitionClient;
  private readonly livenessPassScore: number;
  private readonly faceMatchScore: number;

  constructor(
    private configService: ConfigService,
    private uploadService: UploadService,
  ) {
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
}
