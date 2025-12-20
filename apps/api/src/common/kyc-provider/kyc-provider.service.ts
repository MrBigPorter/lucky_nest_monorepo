import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KycVerifyResult } from '@api/common/kyc-provider/interfaces/kyc-result.interface';
import NodeFormData = require('form-data');
import axios from 'axios';

@Injectable()
export class KycProviderService {
  private readonly logger = new Logger(KycProviderService.name);
  private apiKey: string = '';
  private apiSecret: string = '';
  private passScore: number = 75; // 默认 75
  private useMock: boolean = true;
  private apiUrl: string = '';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('FACEPLUSPLUS_API_KEY') || '';
    this.apiSecret =
      this.configService.get<string>('FACEPLUSPLUS_API_SECRET') || '';
    // 允许配置 API 节点 (用 US 节点更快/更合规: https://api-us.faceplusplus.com/facepp/v3/compare)
    this.apiUrl =
      this.configService.get<string>('FACEPLUSPLUS_API_URL') ||
      'https://api-cn.faceplusplus.com/facepp/v3/compare';
    this.passScore = parseInt(
      this.configService.get<string>('KYC_PASS_SCORE') || '75',
      10,
    );

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    // 如果环境变量里有 Key，就关闭 Mock，启用真机验证
    if (this.apiKey && this.apiSecret) {
      this.useMock = false;
    } else {
      if (isProduction) {
        throw new Error(
          'FATAL: FACEPLUSPLUS_API_KEY is missing in PRODUCTION environment!',
        );
      }
      this.logger.warn('No API Key found. Fallback to MOCK mode (DEV only).');
    }
  }

  /**
   * 调用 Face++ 进行人脸比对
   * @param dto
   */
  async verify(dto: any): Promise<KycVerifyResult> {
    // 使用 Mock 验证
    if (this.useMock) {
      return this.runMockVerification(dto);
    }

    // 调用 Face++ API 进行验证
    return this.runFacePlusPlus(dto.idCardFront, dto.faceImage);
  }

  /**
   * 调用 Face++ Compare API 进行人脸比对
   * @param idCardFront
   * @param faceImage
   * @private
   */
  private async runFacePlusPlus(
    idCardFront: string,
    faceImage: string,
  ): Promise<KycVerifyResult> {
    this.logger.log('Calling Face++ Compare API...');
    const url = 'https://api-cn.faceplusplus.com/facepp/v3/compare';

    try {
      const formData = new NodeFormData();
      formData.append('api_key', this.apiKey);
      formData.append('api_secret', this.apiSecret);
      formData.append('image_url1', idCardFront); // 身份证 (R2 临时链接)
      formData.append('image_url2', faceImage); // 自拍 (R2 临时链接)
      const headers = formData.getHeaders();
      // 发起请求
      const response = await axios.post(url, formData, {
        headers: headers,
        timeout: 15000, // 15 秒超时
      });

      const data = response.data;

      const confidence = data.confidence || 0;
      const passed = confidence > this.passScore;

      this.logger.log(`Face++ Result: Score ${confidence}, Passed: ${passed}`);

      return {
        success: true,
        passed,
        score: confidence,
        rawResponse: data,
        rejectReason: passed
          ? undefined
          : `Low confidence score: ${confidence}`,
      };
    } catch (error: any) {
      this.logger.error(
        'Face++ API Error',
        error.response?.data || error.message,
      );
      // 这样 KycService 就会中断流程，不会把用户标记为 REJECTED，而是让用户稍后重试
      throw new InternalServerErrorException(
        'KYC Provider Service Unavailable',
      );
    }
  }

  /**
   * 运行 Mock 验证 (不调用真实服务)
   * @param dto
   * @private
   */
  private async runMockVerification(dto: any): Promise<KycVerifyResult> {
    this.logger.warn('⚠️ Running in MOCK mode (No real verification)');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (dto.realName && dto.realName.toUpperCase().includes('FAIL')) {
      return {
        success: true,
        passed: false,
        score: 45.5,
        rejectReason: '[Mock] Artificial Reject Triggered',
      };
    }

    // 默认：通过
    return {
      success: true,
      passed: true,
      score: 98.5, // 假装分数很高
      ocrData: {
        name: dto.realName,
        idNumber: dto.idNumber,
      },
    };
  }
}
