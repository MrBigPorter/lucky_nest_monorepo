import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { PaymentChannelService } from '@api/common/payment-channel/payment-channel.service';
import { CreateChannelDto } from '@api/common/payment-channel/dto/create-channel.dto';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { PermissionsGuard } from '@api/common/guards/permissions.guard';
import { RequirePermission } from '@api/common/decorators/require-permission.decorator';
import { OpAction, OpModule } from '@lucky/shared';
import { UpdateChannelDto } from '@api/common/payment-channel/dto/update-channel.dto';
import {
  PaymentChannelDto,
  PaymentChannelListResponse,
} from '@api/admin/payment-channel/dto/payment-channel.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Admin - Payment Channels')
@Controller('admin/payment/channels')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentChannelController {
  constructor(private readonly paymentService: PaymentChannelService) {}

  /**
   * Create a new payment channel
   * @param dto
   */
  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: PaymentChannelDto })
  @RequirePermission(OpModule.FINANCE, OpAction.FINANCE.CREATE_PAYMENT_CHANNEL)
  async create(@Body() dto: CreateChannelDto) {
    const data = await this.paymentService.create(dto);
    return plainToInstance(PaymentChannelDto, data);
  }

  /**
   * Get a paginated list of payment channels with optional type filter
   * @param page
   * @param limit
   * @param type
   */
  @Get('list')
  @RequirePermission(OpModule.FINANCE, OpAction.FINANCE.CHANNEL_VIEW)
  @ApiOkResponse({ type: PaymentChannelListResponse })
  @ApiQuery({
    name: 'type',
    required: false,
    description: '1-Recharge 2-Withdraw',
  })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('pageSize', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('type', new ParseIntPipe({ optional: true })) type?: number,
  ) {
    const data = await this.paymentService.findAll(page, limit, type);
    return {
      ...data,
      list: plainToInstance(PaymentChannelDto, data.list),
    };
  }

  /**
   * Update a payment channel by ID
   * @param id
   * @param dto
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: PaymentChannelDto })
  @RequirePermission(OpModule.FINANCE, OpAction.FINANCE.CHANNEL_UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChannelDto,
  ) {
    const data = await this.paymentService.update(id, dto);
    return plainToInstance(PaymentChannelDto, data);
  }

  /**
   * Disable/soft delete a payment channel
   * @param id
   * @param status
   */
  @Delete(':id/:status')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: PaymentChannelDto })
  @RequirePermission(OpModule.FINANCE, OpAction.FINANCE.CHANNEL_UPDATE)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Param('status', ParseIntPipe) status: number,
  ) {
    const data = await this.paymentService.updateStatus(id, status);
    return plainToInstance(PaymentChannelDto, data);
  }
}
