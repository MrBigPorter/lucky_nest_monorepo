import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { RolesGuard } from '@api/common/guards/roles.guard';
import { OrderService } from '@api/admin/order/order.service';
import { Roles } from '@api/common/decorators/roles.decorator';
import { Role } from '@lucky/shared';
import { QueryOrderDto } from '@api/admin/order/dto/query-order.dto';
import { OrderResponseDto } from '@api/admin/order/dto/order-response.dto';
import { plainToInstance } from 'class-transformer';
import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';
import { UpdateOrderStatusDto } from '@api/admin/order/dto/update-order-status.dto';
import 'reflect-metadata';

@ApiTags('Admin Order Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/order')
export class OrderController {
  constructor(private readonly OrderService: OrderService) {}

  /**
   * Get a paginated list of orders with optional filters
   * @param query
   * @returns Paginated list of orders
   *
   */
  @Get('list')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE, Role.VIEWER)
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiExtraModels(PaginatedResponseDto, OrderResponseDto)
  async findAll(@Query() query: QueryOrderDto) {
    const result = await this.OrderService.findAll(query);

    return {
      ...result,
      list: plainToInstance(OrderResponseDto, result.list, {
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Get order details by ID
   * @param id
   * @returns Order details
   */
  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE, Role.VIEWER)
  @ApiOkResponse({ type: OrderResponseDto })
  async findOne(@Param('id') id: string) {
    const order = await this.OrderService.finOne(id);
    return plainToInstance(OrderResponseDto, order);
  }

  /**
   * Update order status
   * @param id
   * @param dto
   * @returns Updated order
   */
  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: OrderResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.OrderService.updateStatus(id, dto.status);
    return plainToInstance(OrderResponseDto, order);
  }

  /**
   * Delete an order by ID
   * @param id
   * @return Deleted order
   */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    return this.OrderService.remove(id);
  }
}
