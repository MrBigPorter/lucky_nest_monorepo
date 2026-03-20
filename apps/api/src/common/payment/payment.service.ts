import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Xendit } from 'xendit-node';
import { ConfigService } from '@nestjs/config';
import { RelatedType } from '@lucky/shared';
import { GetPayouts200ResponseDataInner } from 'xendit-node/payout/models/GetPayouts200ResponseDataInner';
import { CreateInvoiceRequest } from 'xendit-node/invoice/models';

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
   * @param redirectUrl
   * @param channelCode
   * @param userEmail
   */
  async createRechargeLink(
    orderNo: string, //业务订单号
    amount: number, //金额 (数字类型)
    redirectUrl: string,
    channelCode?: string, //支付渠道代码 (可选，用于指定支付方式)
    userEmail?: string, //用户邮箱 (可选，用于发回执)
  ) {
    try {
      // 构造基础 Payload
      const invoiceData: CreateInvoiceRequest = {
        externalId: orderNo,
        amount: amount,
        description: `${RelatedType.RECHARGE} - ${orderNo}`,
        invoiceDuration: 86400, // 24 hour,
        currency: 'PHP',
        payerEmail: userEmail,
        successRedirectUrl: `${redirectUrl}wallet/recharge/success/${orderNo}`,
        failureRedirectUrl: `${redirectUrl}wallet/recharge/failure/${orderNo}`,
      };

      if (channelCode) {
        const method = channelCode.replace('PH_', '');
        invoiceData.paymentMethods = [method];
      }

      const response = await this.xenditClient.Invoice.createInvoice({
        data: invoiceData,
      });

      this.logger.log(`[Xendit] Invoice created: ${response.invoiceUrl}`);
      return response.invoiceUrl;
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      this.handleXenditError(error, 'Create Disbursement');
    }
  }

  /**
   *  Get Invoice details by Invoice ID
   * @param invoiceId
   */
  async getInvoiceById(invoiceId: string) {
    try {
      return await this.xenditClient.Invoice.getInvoiceById({
        invoiceId: invoiceId,
      });
    } catch (error: unknown) {
      this.handleXenditError(error, `Get Invoice By ID: ${invoiceId}`);
      return null;
    }
  }

  /**
   * Get Invoice details by External ID (business order number)
   * @param externalId
   */
  async getInvoiceByExternalId(externalId: string) {
    try {
      const response = await this.xenditClient.Invoice.getInvoices({
        externalId: externalId,
        limit: 1,
      });

      this.logger.log(
        `Xendit Response for ${externalId}: ${JSON.stringify(response)}`,
      );

      if (response && response.length > 0) {
        return response[0];
      }
      return null;
    } catch (e: unknown) {
      this.handleXenditError(e, `Get Invoice By External ID: ${externalId}`);
      return null;
    }
  }

  /**
   * Get Disbursement details by External ID (business order number)
   * @param externalId 这里的 externalId 实际上对应 Xendit 的 reference_id
   */
  async getDisbursementByExternalId(externalId: string) {
    try {
      const response = await this.xenditClient.Payout.getPayouts({
        referenceId: externalId,
        limit: 1,
      });
      // 严谨判断
      if (response && response.data && response.data.length > 0) {
        return response.data[0];
      }
      return null; // 显式返回 null，表示没找到
    } catch (e: unknown) {
      this.handleXenditError(
        e,
        `Get Disbursement By External ID: ${externalId}`,
      );
      return null;
    }
  }

  /** Handle Xendit API errors uniformly
   * @param error
   * @param context
   */
  private handleXenditError(error: unknown, context: string) {
    const msg = error instanceof Error ? error.message : String(error);
    this.logger.error(`[Xendit Error - ${context}] ${msg}`);
    if (error !== null && typeof error === 'object') {
      if ('response' in error) {
        console.error(
          'Xendit Response Body:',
          JSON.stringify((error as { response: unknown }).response, null, 2),
        );
      }
      if ('issues' in error) {
        console.error(
          'Xendit Issues:',
          JSON.stringify((error as { issues: unknown }).issues, null, 2),
        );
      }
    }
    throw new InternalServerErrorException(`Payment Gateway Error: ${context}`);
  }
}
