import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Xendit } from 'xendit-node';
import { ConfigService } from '@nestjs/config';
import { RelatedType } from '@lucky/shared';
import { GetPayouts200ResponseDataInner } from 'xendit-node/payout/models/GetPayouts200ResponseDataInner';

@Injectable()
export class PaymentService {
  private readonly xenditClient: Xendit;
  private readonly logger = new Logger(PaymentService.name);
  constructor(private configService: ConfigService) {
    // 初始化 Xendit 客户端
    const secretKey = this.configService.get<string>('XENDIT_SECRET_KEY');
    this.xenditClient = new Xendit({
      secretKey: secretKey || '',
    });
  }

  /**
   * 纯工具：校验 Xendit 回调 Token
   * @param token
   */
  verifyCallbackToken(token: string): boolean {
    const mySecretToken = this.configService.get<string>(
      'XENDIT_CALLBACK_TOKEN',
    );
    if (!mySecretToken) {
      this.logger.error('XENDIT_CALLBACK_TOKEN is not set in env');
      return false;
    }
    return token === mySecretToken;
  }

  /** Create a recharge payment link using Xendit Invoice
   * @param orderNo
   * @param amount
   * @param userEmail
   */
  async createRechargeLink(
    orderNo: string, //业务订单号
    amount: number, //金额 (数字类型)
    userEmail?: string, //用户邮箱 (可选，用于发回执)
  ) {
    try {
      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      );

      const response = await this.xenditClient.Invoice.createInvoice({
        data: {
          externalId: orderNo,
          amount: amount,
          description: `${RelatedType.RECHARGE} - ${orderNo}`,
          invoiceDuration: 86400, // 24 hour,
          currency: 'PHP',
          payerEmail: userEmail,
          successRedirectUrl: `${frontendUrl}/wallet/recharge/success`,
          failureRedirectUrl: `${frontendUrl}/wallet/recharge/failure`,
        },
      });

      this.logger.log(`[Xendit] Invoice created: ${response.invoiceUrl}`);
      return response.invoiceUrl;
    } catch (error: any) {
      this.handleXenditError(error, 'Create Invoice');
    }
  }

  /**
   * Money Out: 发起代付
   * @param payload
   */
  async createDisbursement(payload: {
    orderNo: string;
    amount: number;
    bankCode: string; // 如 'PH_GCASH', 'PH_BPI'
    accountNumber: string;
    accountName: string; // 用户填写的真实姓名
    description?: string; // 用户填写的手机号或卡号
  }) {
    try {
      this.logger.log(
        `[Xendit] Creating Disbursement for ${payload.orderNo} - ${payload.bankCode}`,
      );

      const response: GetPayouts200ResponseDataInner =
        await this.xenditClient.Payout.createPayout({
          idempotencyKey: `payout-${payload.orderNo}`,
          data: {
            referenceId: payload.orderNo,
            currency: 'PHP',
            channelCode: payload.bankCode,
            channelProperties: {
              accountNumber: payload.accountNumber,
              accountHolderName: payload.accountName,
            },
            amount: payload.amount,
            description:
              payload.description ||
              `${RelatedType.WITHDRAWAL}-${payload.orderNo}`,
          },
        });

      this.logger.log(
        `[Xendit] Payout Created: ${response.id} | Status: ${response.status}`,
      );

      return response;
    } catch (error: any) {
      this.handleXenditError(error, 'Create Disbursement');
    }
  }

  private handleXenditError(error: any, context: string) {
    this.logger.error(`[Xendit Error - ${context}] ${error.message}`);
    if (error.response?.data) {
      console.error(
        'Xendit Raw Error Details:',
        JSON.stringify(error.response.data, null, 2),
      );
    }
    throw new InternalServerErrorException(`Payment Gateway Error: ${context}`);
  }
}
