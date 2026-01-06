import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { QueryOrderDto } from '@api/admin/order/dto/query-order.dto';
import { Prisma } from '@prisma/client';
import {
  ORDER_STATUS,
  REFUND_STATUS,
  PaymentMethod,
  TRANSACTION_TYPE,
} from '@lucky/shared';
import { WalletService } from '@api/client/wallet/wallet.service';
import { RefundAuditDto } from '@api/admin/order/dto/refund-audit.dto';

@Injectable()
export class OrderService {
  constructor(
    private prismaService: PrismaService,
    private walletService: WalletService,
  ) {}

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

  /**
   * Approve a refund request by admin
   * @param adminId
   * @param orderId
   */
  async approveRefundByAdmin(adminId: string, orderId: string) {
    // 开启事务处理
    return this.prismaService.$transaction(async (ctx) => {
      const order = await this.finOne(orderId);
      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      // Only allow refund approval for orders that are pending refund
      if (order.refundStatus !== REFUND_STATUS.REFUNDING) {
        throw new BadRequestException(
          `Only orders that are pending refund can be approved`,
        );
      }

      // 核心退款逻辑
      const isBalancePay =
        !order.paymentMethod || order.paymentMethod === PaymentMethod.BALANCE;

      if (isBalancePay) {
        // 余额支付退款逻辑
        if (Number(order.finalAmount) > 0) {
          // 增加用户余额
          await this.walletService.creditCash(
            {
              userId: order.userId,
              amount: order.finalAmount,
              related: { id: order.orderId, type: 'ORDER' },
              desc: `Refund for order ${order.orderNo} approved by admin ${adminId}`,
              type: TRANSACTION_TYPE.REFUND,
            },
            ctx,
          );
        }

        // 2. 退金币 (如果 coinUsed > 0)
        if (Number(order.coinUsed) > 0) {
          await this.walletService.creditCoin(
            {
              userId: order.userId,
              coins: order.coinUsed,
              related: { id: order.orderId, type: 'ORDER' },
              desc: `Coin refund for order ${order.orderNo} approved by admin ${adminId}`,
              type: TRANSACTION_TYPE.REFUND,
            },
            ctx,
          );
        }

        // 更新订单状态为已退款
        return ctx.order.update({
          where: { orderId },
          data: {
            orderStatus: ORDER_STATUS.REFUNDED,
            refundStatus: REFUND_STATUS.REFUNDED,
            refundAuditedBy: adminId,
            refundedAt: new Date(),
            refundAmount: order.finalAmount,
          },
        });
      }
    });
  }

  /**
   * Reject a refund request by admin
   * @param adminId
   * @param dto
   */
  async rejectRefundByAdmin(adminId: string, dto: RefundAuditDto) {
    const { orderId, rejectReason } = dto;

    const order = await this.prismaService.order.findUnique({
      where: { orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    // 1. 状态校验：只有“退款中”的才能拒绝
    if (order.refundStatus !== REFUND_STATUS.REFUNDING) {
      throw new BadRequestException('Order is not waiting for approval.');
    }

    // 2. 执行更新 (不需要 WalletService，因为没退钱)
    // 直接更新数据库即可
    return this.prismaService.order.update({
      where: { orderId },
      data: {
        // 状态流转：REFUNDING (1) -> REFUND_FAILED (3)
        // 注意：orderStatus 保持 PAID (3) 不变，因为没退款，订单依然算“已支付”状态

        refundStatus: REFUND_STATUS.REFUND_FAILED,

        refundRejectReason: rejectReason, // 记录原因，给用户看
        refundAuditedBy: adminId, // 记录是谁拒绝的

        // 可选：记录拒绝时间
        // refundedAt 字段通常留给成功退款的时间，
        // 如果你想记拒绝时间，可以利用 updatedAt 或者加个 refundRejectedAt 字段
      },
    });
  }
}
