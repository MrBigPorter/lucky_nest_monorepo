import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from '@api/client/orders/order.service';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { CheckoutDto } from '@api/client/orders/dto/checkout.dto';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { CheckoutResponseDto } from '@api/client/orders/dto/checkout-response.dto';
import { ListOrdersDto } from '@api/client/orders/dto/list-orders.dto';
import { OrderDetailDto } from '@api/client/orders/dto/order-detail.dto';
import { ListOrdersResponseDto } from '@api/client/orders/dto/list-orders-response.dto';
import { OrderDetailResponseDto } from '@api/client/orders/dto/order-detail-response.dto';
import { RefundApplyDto } from '@api/client/orders/dto/refund-apply.dto';
import { RefundResponseClientDto } from '@api/client/orders/dto/refund-response.client.dto';
import { plainToInstance } from 'class-transformer';
import { OrderItemDto } from '@api/client/orders/dto/order-item.dto';

@Controller('orders')
export class OrderController {
  // Order-related endpoints would be defined here
  constructor(private orders: OrderService) {}

  // Checkout endpoint
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CheckoutResponseDto })
  async checkout(
    @Body() dto: CheckoutDto,
    @CurrentUserId() userId: string,
  ): Promise<CheckoutResponseDto> {
    const data = await this.orders.checkOut(userId, dto);
    return plainToInstance(CheckoutResponseDto, data);
  }

  // List orders endpoint
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('list')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ListOrdersResponseDto })
  async list(@CurrentUserId() userId: string, @Body() body: ListOrdersDto) {
    const data = await this.orders.listOrders(userId, body);
    return {
      ...data,
      list: plainToInstance(OrderItemDto, data.list),
    };
  }

  // order details endpoint
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('detail')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: OrderDetailResponseDto })
  async detail(@Body() body: OrderDetailDto, @CurrentUserId() userId: string) {
    const data = await this.orders.getOrderDetail(userId, body.orderId);
    return plainToInstance(OrderDetailResponseDto, data);
  }

  // apply for a refund endpoint
  @Post('refund/apply')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: RefundResponseClientDto })
  async applyRefund(
    @Body() dto: RefundApplyDto,
    @CurrentUserId() userId: string,
  ) {
    const data = await this.orders.applyRefund(userId, dto);
    return plainToInstance(RefundResponseClientDto, data);
  }
}
