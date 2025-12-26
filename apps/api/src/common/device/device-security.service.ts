import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { DeviceInfo } from '@api/common/decorators/http.decorators';
import { TimeHelper } from '@lucky/shared';
import { RedisService } from '@api/common/redis/redis.service';

@Injectable()
export class DeviceSecurityService {
  private readonly logger = new Logger(DeviceSecurityService.name);

  constructor(
    private prismaService: PrismaService,
    private redisService: RedisService,
  ) {}

  /**
   * 验证并记录设备信息 (高性能版)
   * 策略：Redis 优先 -> 5分钟缓存 -> DB 兜底
   */
  async validateAndLogDevice(userId: string, info: DeviceInfo) {
    if (!info.deviceId || info.deviceId === 'unknown') {
      return; // 无法识别的设备视情况放行
    }

    //  1. 第一道防线：Redis 黑名单 (极速拦截)
    const isBlacklisted = await this.redisService.sismember(
      'security:device:blacklist',
      info.deviceId,
    );

    if (isBlacklisted) {
      this.logger.warn(
        `[Risk] Blocked Redis-blacklisted device: ${info.deviceId}`,
      );
      throw new ForbiddenException({
        code: 'DEVICE_BANNED',
        message: 'Your device has been restricted. Please contact support.',
      });
    }

    //  2. 性能核心：检查 "活跃缓存" (Throttling)
    // 如果这个用户在这个设备上 5 分钟内已经验证过，直接跳过后续所有 DB 操作
    const cacheKey = `security:device:active:${userId}:${info.deviceId}`;
    const lastActive = await this.redisService.get(cacheKey);

    if (lastActive) {
      //  缓存存在，说明刚刚验证过，直接放行
      // 这里省下了：1次 DB查黑名单 + 1次 DB Count + 1次 DB Upsert
      return;
    }

    // =========== 下面是 "冷启动" 或 "缓存过期" (每5分钟一次) 的逻辑 ===========

    // 3. 查 DB 全局黑名单 (防止 Redis 数据丢失的双重保险)
    const dbBanned = await this.prismaService.deviceBlacklist.findUnique({
      where: { deviceId: info.deviceId },
      select: { id: true }, // 只查 ID 节省流量
    });

    if (dbBanned) {
      // 同步回 Redis，防止下次请求再次穿透到 DB
      await this.redisService.sadd('security:device:blacklist', info.deviceId);
      throw new ForbiddenException('Access from this device is banned.');
    }

    // 4. 查 "一机多号" (关联用户数)
    // 优化：先看这个设备是不是已经是当前用户的老设备了
    const existingBinding = await this.prismaService.userDevice.findUnique({
      where: { userId_deviceId: { userId, deviceId: info.deviceId } },
      select: { isTrusted: true },
    });

    // 只有在 "新设备绑定" 时，才检查是否关联了太多人 (Count 操作很慢，能省则省)
    if (!existingBinding) {
      const linkedUsers = await this.prismaService.userDevice.count({
        where: { deviceId: info.deviceId, userId: { not: userId } },
      });

      // 阈值：如果这台手机登过超过 3 个其他账号，自动封杀
      if (linkedUsers >= 3) {
        await this.autoBlockDevice(
          info.deviceId,
          'Auto-block: Device farming detected (Multi-account)',
        );
        throw new ForbiddenException(
          'This device is linked to too many accounts.',
        );
      }
    }

    // 5. 记录/更新设备 (Upsert)
    // 只有缓存过期了才会执行这一步，减轻 DB 写压力
    await this.prismaService.userDevice.upsert({
      where: { userId_deviceId: { userId, deviceId: info.deviceId } },
      update: {
        lastActiveAt: new Date(),
        ipAddress: info.ip,
      },
      create: {
        userId,
        deviceId: info.deviceId,
        deviceModel: info.deviceModel,
        ipAddress: info.ip,
        isTrusted: false, // 新设备默认 False
      },
    });

    //  6. 写入缓存，设置 5 分钟 (300秒) 有效期
    // 5分钟内，同一个用户的同一个设备再次请求，会在第 2 步直接返回
    await this.redisService.set(cacheKey, '1', 300);
  }

  /**
   * 检查用户设备是否符合提现等敏感操作的要求
   */
  async checkWithdrawEligibility(userId: string, deviceId: string) {
    // 提现操作频率低，可以直接查库，保证数据绝对实时
    const device = await this.prismaService.userDevice.findUnique({
      where: {
        userId_deviceId: { userId, deviceId },
      },
    });

    if (!device) {
      throw new ForbiddenException('Device not recognized for withdrawals.');
    }

    const hoursSinceCreated = TimeHelper.isOlderThan(
      device.createdAt,
      24,
      'hour',
    );

    if (!hoursSinceCreated) {
      throw new ForbiddenException(
        'For security, sensitive actions are disabled for 24h on new devices.',
      );
    }

    return true;
  }

  /**
   * 辅助方法：自动拉黑异常设备
   */
  private async autoBlockDevice(deviceId: string, reason: string) {
    this.logger.warn(` Auto-blocking device: ${deviceId}, Reason: ${reason}`);

    // 1. 写库
    await this.prismaService.deviceBlacklist
      .create({
        data: { deviceId, reason },
      })
      .catch((e) => this.logger.error('Blacklist DB insert failed', e));

    // 2. 写 Redis
    await this.redisService.sadd('security:device:blacklist', deviceId);
  }
}
