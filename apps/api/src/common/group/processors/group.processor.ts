import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { Job } from 'bullmq';
import { ORDER_STATUS, PAY_STATUS } from '@lucky/shared';

@Processor('group_settlement', {
  concurrency: 5, // 企业级限流：同时只允许 5 个任务并行处理，保护数据库
})
export class GroupProcessor extends WorkerHost {
  private readonly logger = new Logger(GroupProcessor.name);
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ groupId: string }>): Promise<any> {
    const { groupId } = job.data;

    switch (job.name) {
      case 'activate_orders':
        return await this.handleOrderActivation(groupId);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return;
    }
  }

  /**
   * 核心逻辑：激活订单状态
   * 解决你提到的“团成功后看不见记录”问题
   */

  private async handleOrderActivation(groupId: string) {
    this.logger.log(`Activating orders for group ${groupId}...`);
    //1.获取真人团信息
    const members = await this.prisma.treasureGroupMember.findMany({
      where: {
        groupId,
        orderId: { not: null },
      },
      select: { orderId: true },
    });

    if (members.length === 0) {
      this.logger.warn(`No members with orders found for group ${groupId}.`);
      return;
    }

    const orderIds = members.map((m) => m.orderId!);

    //2.批量更新订单状态为已激活
    try {
      const result = await this.prisma.order.updateMany({
        where: {
          orderId: { in: orderIds },
          payStatus: PAY_STATUS.PAID,
          orderStatus: {
            not: ORDER_STATUS.WAIT_DELIVERY,
          },
        },
        data: {
          orderStatus: ORDER_STATUS.WAIT_DELIVERY,
          updatedAt: new Date(),
        },
      });
    } catch (e: any) {
      this.logger.error(`Failed to activate orders: ${e.message}`);
      throw e; //  抛出异常，BullMQ 才会自动触发重试 (1s, 2s, 4s...)
    }
  }
}
