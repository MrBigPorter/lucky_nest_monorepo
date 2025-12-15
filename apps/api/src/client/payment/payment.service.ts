import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { WalletService } from '@api/client/wallet/wallet.service';
import { PaymentCallbackDto } from '@api/client/payment/dto/payment-callback.dto';
import { Prisma } from '@prisma/client';
import { OpAction, RECHARGE_STATUS } from '@lucky/shared';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  constructor(
    private prismaService: PrismaService,
    private walletService: WalletService,
  ) {}

  /** Handle recharge payment callback
   *
   * @param channel Payment channel (e.g., 'PAYPAL', 'STRIPE')
   * @param payload Callback payload from payment gateway
   */
  async handleRechargeCallback(channel: string, payload: PaymentCallbackDto) {
    const {
      orderNo,
      amount,
      status,
      transactionId,
      metadata,
      paidA,
      signature,
    } = payload;

    const amountDecimal = new Prisma.Decimal(amount);

    this.logger.log(
      `Received callback for ${orderNo} via ${channel}: ${status}`,
    );

    // 1. 安全验签 (TODO: 对接真实支付网关时必须实现)
    // if (!this.verifySignature(payload, signature, channel)) {
    //   throw new BadRequestException('Invalid signature');
    // }

    // 如果网关通知的状态不是成功，则只记录日志，不进行资金处理
    if (status !== 'SUCCESS') {
      this.logger.warn(
        `Order ${orderNo} payment failed via gateway. Status: ${status}`,
      );
      return { status: 'IGNORED', message: 'Payment status is not success' };
    }

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
            type: OpAction.FINANCE.RECHARGE_AUDIT,
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
          callbackData: payload as any,
        },
      });
    });
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
