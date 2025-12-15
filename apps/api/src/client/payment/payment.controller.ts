import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { PaymentService } from '@api/client/payment/payment.service';
import { PaymentCallbackDto } from '@api/client/payment/dto/payment-callback.dto';

@ApiTags('Payment Webhook')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Payment gateway webhook endpoint
   * 接收第三方支付网关的回调通知
   * 此接口不需要 User Guard，因为是由支付网关调用的
   * @param channel
   * @param payload
   */
  @Post('webhook/:channel')
  @HttpCode(HttpStatus.OK)
  @ApiProperty({ description: 'Payment gateway webhook endpoint' })
  async handleWebhook(
    @Param('channel') channel: string,
    @Body() payload: PaymentCallbackDto,
  ) {
    try {
      await this.paymentService.handleRechargeCallback(channel, payload);

      return { status: 'SUCCESS', message: 'Callback processed successfully' };
    } catch (error) {
      throw error;
    }
  }
}
