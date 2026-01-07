import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';
import { PaymentChannelService } from '@api/common/payment-channel/payment-channel.service';
import { PaymentConfigItemDto } from '@api/client/payment-channel/dto/payment-channel.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Client - Payment Channels')
@Controller('client/payment/channels')
export class PaymentClientController {
  constructor(private readonly paymentService: PaymentChannelService) {}

  /**
   * Get payment configuration for recharge or withdraw
   */
  @Get('recharge')
  @ApiOkResponse({ type: [PaymentConfigItemDto] })
  async getRechargeConfig() {
    const data = await this.paymentService.getClientConfig(1); // 1 = Recharge
    return plainToInstance(PaymentConfigItemDto, data);
  }

  /**
   * Get payment configuration for withdraw
   */
  @Get('withdraw')
  @ApiOkResponse({ type: PaymentConfigItemDto })
  async getWithdrawConfig() {
    const data = await this.paymentService.getClientConfig(2); // 2 = Withdraw
    return plainToInstance(PaymentConfigItemDto, data);
  }
}
