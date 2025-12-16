import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { WalletService } from '@api/client/wallet/wallet.service';
import { Prisma } from '@prisma/client';
import { OpAction, RECHARGE_STATUS, RelatedType } from '@lucky/shared';
import Xendit from 'xendit-node';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentService {
  private readonly xenditClient: any;
  private readonly logger = new Logger(PaymentService.name);
  constructor(
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {
    // 初始化 Xendit 客户端
    const secretKey = this.configService.get<string>('XENDIT_SECRET_KEY');
    this.xenditClient = new Xendit({
      secretKey: secretKey || '',
    });
  }

  /** Handle recharge payment callback
   *
   * @param channel Payment channel (e.g., 'PAYPAL', 'STRIPE')
   * @param payload Callback payload from payment gateway
   * @param token
   */
  async handleRechargeCallback(channel: string, payload: any, token: string) {
    if (channel === 'xendit') {
      const mySecretToken = this.configService.get<string>(
        'XENDIT_CALLBACK_TOKEN',
      );
      if (!mySecretToken) {
        throw new InternalServerErrorException(
          `XENDIT_CALLBACK_TOKEN is not set`,
        );
      }
      if (token !== mySecretToken) {
        this.logger.log(`Invalid Xendit callback token: ${token}`);
        throw new InternalServerErrorException('Invalid callback token');
      }
    }

    let orderNo, status, amount, transactionId;
    if (channel === 'xendit') {
      orderNo = payload.external_id;
      status = payload.status; // 'PAID', 'EXPIRED', etc.
      amount = payload.amount;
      transactionId = payload.id;
    } else {
      orderNo = payload.orderNo;
      status = payload.status;
      amount = payload.amount;
      transactionId = payload.transactionId;
    }

    this.logger.log(`Processing Order: ${orderNo}, Status: ${status}`);

    // 状态检查 (Xendit 成功状态通常是 'PAID' 或 'SETTLED')
    if (status !== 'PAID' && status !== 'SUCCESS' && status !== 'SETTLED') {
      this.logger.warn(
        `Order ${orderNo} has non-success status: ${status}, ignoring.`,
      );
      return { status: 'IGNORED', message: `Status is ${status}` };
    }

    const amountDecimal = new Prisma.Decimal(amount);

    //开启强事务，确保资金和订单状态一致性
    return this.prismaService.$transaction(async (ctx) => {
      // 2. 查找充值订单
      const order = await ctx.rechargeOrder.findUnique({
        where: { rechargeNo: orderNo },
      });

      if (!order) {
        throw new Error('Recharge order not found');
      }

      // 3. 幂等性检查 (Idempotency Check)
      // 如果订单已经是成功状态，直接返回成功，防止重复加钱
      if (order.rechargeStatus === RECHARGE_STATUS.SUCCESS) {
        return {
          message: 'Order already processed',
          order,
        };
      }

      if (!order.rechargeAmount.equals(amountDecimal)) {
        this.logger.error(
          `Amount mismatch for ${orderNo}. Order: ${order.rechargeAmount}, Paid: ${amountDecimal}`,
        );
        throw new InternalServerErrorException('Amount mismatch in callback');
      }

      // 5. 原子加钱 (调用 WalletService 底层)
      // 这会创建一条 RECHARGE 类型的 WalletTransaction
      const { transactionId: txnId } = await this.walletService.creditCash(
        {
          userId: order.userId,
          amount: amountDecimal,
          related: {
            id: order.rechargeId,
            type: RelatedType.RECHARGE,
          },
          desc: `Recharge via ${channel}. Gate Txn: ${transactionId}`,
        },
        ctx,
      );

      // 6. 更新订单状态 (Finalize Order)
      const updatedOrder = await ctx.rechargeOrder.update({
        where: { rechargeId: order.rechargeId },
        data: {
          rechargeStatus: RECHARGE_STATUS.SUCCESS,
          thirdPartyOrderNo: transactionId,
          paymentChannel: channel,
          paidAt: new Date(),
          callbackData: payload,
        },
      });
      return {
        message: 'Recharge successful',
      };
    });
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
      const key = this.configService.get('XENDIT_SECRET_KEY');
      const maskedKey = key ? `${key.substring(0, 5)}...` : 'MISSING/EMPTY';

      this.logger.log(
        `[Debug] Using Xendit Key: ${maskedKey}, Order: ${orderNo}, Amount: ${amount}`,
      );

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
          successRedirectURL: `${frontendUrl}/wallet/recharge/success`,
          failureRedirectURL: `${frontendUrl}/wallet/recharge/failure`,
        },
      });

      this.logger.log(`[Xendit] Invoice created: ${response.invoiceUrl}`);
      return response.invoiceUrl;
    } catch (error: any) {
      console.log('================ XENDIT ERROR DEBUG START ================');
      if (error.response && error.response.data) {
        console.log(
          'Xendit API Response:',
          JSON.stringify(error.response.data, null, 2),
        );
      } else {
        // 如果没有 response，打印整个 error 对象
        console.log('Raw Error Object:', JSON.stringify(error, null, 2));
      }
      console.log('================ XENDIT ERROR DEBUG END ================');

      this.logger.error(`[Xendit] Error creating Invoice: ${error.message}`);

      throw new InternalServerErrorException('Payment gateway unavailable');
    }
  }

  private verifySignature(
    payload: any,
    signature: string,
    channel: string,
  ): boolean {
    // const secret = this.configService.get(`PAYMENT_${channel.toUpperCase()}_SECRET`);
    // const calculated = sha256(payload + secret);
    // return calculated === signature;
    return true;
  }
}
