import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Headers,
} from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { PaymentService } from '@api/client/payment/payment.service';
import { PaymentCallbackDto } from '@api/client/payment/dto/payment-callback.dto';

@ApiTags('Payment Webhook')
@Controller('payment')
export class PaymentController {
  // init logger
  private readonly logger = new Logger(PaymentService.name);
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Payment gateway webhook endpoint
   * 接收第三方支付网关的回调通知
   * 此接口不需要 User Guard，因为是由支付网关调用的
   * @param channel
   * @param payload
   * @param token
   */
  @Post('webhook/:channel')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('channel') channel: string,
    @Body() payload: any, //防止网关增加字段导致 DTO 校验失败 (400 Bad Request)
    @Headers('x-callback-token') token: string,
  ) {
    // Log the received callback
    this.logger.log(`Received payment callback on channel: ${channel}`);
    try {
      await this.paymentService.handleRechargeCallback(channel, payload, token);

      return { status: 'SUCCESS', message: 'Callback processed successfully' };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error processing payment callback for channel ${channel}: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }
}
