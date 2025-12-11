import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { QueryOrderDto } from '@api/admin/order/dto/query-order.dto';
import { Prisma } from '@prisma/client';
import { ORDER_STATUS } from '@lucky/shared';

@Injectable()
export class OrderService {
  constructor(private prismaService: PrismaService) {}

  /**
   * Get a paginated list of orders with optional filters
   * @param dto
   * @returns Paginated list of orders
   *
   */
  async findAll(dto: QueryOrderDto) {
    const { page = 1, pageSize = 10, keyword, orderStatus } = dto;
    const skip = (page - 1) * pageSize;

    // Build dynamic where conditions
    const whereConditions: Prisma.OrderWhereInput = {};

    // Filter by order status if provided
    if (orderStatus) {
      whereConditions.orderStatus = orderStatus;
    }

    // Keyword search across orderNo, user nickname, and user phone
    if (keyword) {
      // Use OR condition for keyword search
      whereConditions.OR = [
        { orderNo: { contains: keyword, mode: 'insensitive' } },
        { user: { nickname: { contains: keyword, mode: 'insensitive' } } },
        { user: { phone: { contains: keyword } } },
      ];
    }

    // Execute count and findMany in a transaction,ensuring data consistency
    const [total, list] = await this.prismaService.$transaction([
      this.prismaService.order.count({
        where: whereConditions,
      }),
      this.prismaService.order.findMany({
        where: whereConditions,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        // Include related user and treasure information
        include: {
          user: true,
          treasure: true,
        },
      }),
    ]);

    return { total, list, page, pageSize };
  }

  /**
   * Get detailed information of a specific order by ID
   * @param orderId
   * @returns Order details
   */
  async finOne(orderId: string) {
    // Find order by ID with related user, treasure, and group information
    const order = await this.prismaService.order.findUnique({
      where: { orderId },
      include: {
        user: true,
        treasure: true,
        group: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return order;
  }

  /**
   * Update the status of an order
   * @param id
   * @param status
   * @returns Updated order
   */
  async updateStatus(id: string, status: number) {
    // Retrieve the order to check its current status
    const order = await this.finOne(id);

    // Prevent modifications if the order is already refunded
    if (order.orderStatus === ORDER_STATUS.REFUNDED) {
      throw new BadRequestException(
        `Order has already been refunded and cannot be modified`,
      );
    }

    // Update the order status
    return this.prismaService.order.update({
      where: {
        orderId: id,
      },
      data: {
        orderStatus: status,
      },
      include: {
        user: true,
        treasure: true,
        group: true,
      },
    });
  }

  /**
   * Delete an order by ID
   * @param id
   * @returns Deleted order
   */
  async remove(id: string) {
    // Retrieve the order to check its current status
    const order = await this.finOne(id);

    // Only allow deletion of orders that are canceled or refunded
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Check if the order status allows deletion
    if (
      order.orderStatus !== ORDER_STATUS.CANCELED &&
      order.orderStatus !== ORDER_STATUS.REFUNDED
    ) {
      throw new BadRequestException(
        `Only orders that are canceled or refunded can be deleted`,
      );
    }

    // Proceed to delete the order
    return this.prismaService.order.delete({
      where: { orderId: id },
    });
  }
}
