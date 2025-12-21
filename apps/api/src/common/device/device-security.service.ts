import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { DeviceInfo } from '@api/common/decorators/http.decorators';
import { TimeHelper } from '@lucky/shared';

@Injectable()
export class DeviceSecurityService {
  constructor(private prismaService: PrismaService) {}

  /**
   * 验证并记录设备信息
   * @param userId
   * @param info
   */
  async validateAndLogDevice(userId: string, info: DeviceInfo) {
    if (!info.deviceId || info.deviceId === 'unknown') {
      // 可以在这里选择是否放行无指纹请求
    }

    //查全局黑名单
    const isBanned = await this.prismaService.deviceBlacklist.findUnique({
      where: { deviceId: info.deviceId },
    });
    if (isBanned) {
      throw new ForbiddenException('Access from this device is banned.');
    }
    // 2. 查 "一机多号" (关联用户数)
    const linkedUsers = await this.prismaService.userDevice.count({
      where: { deviceId: info.deviceId, userId: { not: userId } },
    });

    // 阈值：如果这台手机登过超过 3 个其他账号，封杀
    if (linkedUsers >= 3) {
      throw new ForbiddenException(
        'This device is linked to multiple accounts.',
      );
    }

    // 3. 记录/更新设备 (Upsert)
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
  }

  /**
   * 检查用户设备是否符合提现等敏感操作的要求
   * @param userId
   * @param deviceId
   */
  async checkWithdrawEligibility(userId: string, deviceId: string) {
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
}
