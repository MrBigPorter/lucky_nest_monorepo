import { Injectable, Logger } from '@nestjs/common';
import { FinanceService } from '@api/admin/finance/finance.service';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RECHARGE_STATUS, TimeHelper } from '@lucky/shared';
import dayjs from 'dayjs';

@Injectable()
export class FinanceTask {
  private readonly logger = new Logger(FinanceTask.name);

  // 简单的内存锁，防止任务重叠执行
  private isRunning = false;

  constructor(
    private financeService: FinanceService,
    private prismaService: PrismaService,
  ) {}

  /**
   * 每 10 分钟检查一次充值订单状态，对于超过 30 分钟未完成的充值订单，尝试自动同步状态
   *
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleStuckOrders() {
    // check if the task is already running
    if (this.isRunning) {
      this.logger.warn('Previous task is still running. Skipping this run.');
      return;
    }
    this.isRunning = true;

    try {
      // 30 分钟前的时间点
      const timeThreshold = TimeHelper.toDate(dayjs().subtract(30, 'minute'));

      const stuckOrders = await this.prismaService.rechargeOrder.findMany({
        where: {
          rechargeStatus: RECHARGE_STATUS.PENDING,
          createdAt: { lt: timeThreshold }, // get orders created before the threshold,30 minutes ago
        },
        take: 20, // limit to 20 orders per run
        orderBy: {
          createdAt: 'asc', // oldest first
        },
      });

      if (stuckOrders.length === 0) return;

      this.logger.log(` Auto-Sync found ${stuckOrders.length} stuck orders...`);

      for (const order of stuckOrders) {
        try {
          const result = await this.financeService.syncRechargeStatus(
            order.rechargeId,
            'SYSTEM_BOT',
          );
          if (result.status !== 'NO_CHANGE') {
            this.logger.log(`[Auto-Fix] ${order.rechargeNo}: ${result.status}`);
          }

          // 500ms delay to be polite to Xendit API
          await new Promise((resolve) => setTimeout(resolve, 500)); // 1 second delay between requests
        } catch (error: any) {
          this.logger.error(
            `[Auto-Fix Failed] ${order.rechargeNo}: ${error.message}`,
          );
        }
      }
    } catch (e) {
      this.logger.error('Critical Error in FinanceTask', e);
    } finally {
      this.isRunning = false;
    }
  }
}
