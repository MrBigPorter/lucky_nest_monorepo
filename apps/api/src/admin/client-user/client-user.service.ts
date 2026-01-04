import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import {
  BanDeviceDto,
  QueryClientUserDto,
  UpdateUserStatusDto,
} from '@api/admin/client-user/dto/client-user.dto';
import { Prisma } from '@prisma/client';
import { TimeHelper } from '@lucky/shared';

@Injectable()
export class ClientUserService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 查询用户列表
   * @param query
   */
  async findAll(query: QueryClientUserDto) {
    const { page, pageSize, phone, userId, kycStatus, startTime, endTime } =
      query;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 构建查询条件
    const whereConditions: Prisma.UserWhereInput = {};

    if (userId) {
      whereConditions.id = userId;
    }

    // 手机号模糊查询
    if (phone) {
      whereConditions.phone = { contains: phone };
    }

    // kycStatus 精确查询
    if (kycStatus !== undefined) {
      whereConditions.kycStatus = kycStatus;
    }

    // 注册时间范围查询
    if (startTime || endTime) {
      whereConditions.createdAt = {};
      if (startTime) {
        whereConditions.createdAt.gte = TimeHelper.toDate(startTime);
      }
      if (endTime) {
        whereConditions.createdAt.lte = TimeHelper.toDate(endTime);
      }
    }

    // 查询用户和总数
    const [total, users] = await this.prismaService.$transaction([
      this.prismaService.user.count({ where: whereConditions }),
      this.prismaService.user.findMany({
        where: whereConditions,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          nickname: true,
          avatar: true,
          phoneMd5: true,
          inviteCode: true,
          vipLevel: true,
          lastLoginAt: true,
          kycStatus: true,
          selfExclusionExpireAt: true,
          createdAt: true,
          // Add other fields as necessary
          wallet: {
            select: {
              realBalance: true,
              coinBalance: true,
            },
          },
        },
      }),
    ]);
    return {
      total,
      list: users,
      page,
      pageSize,
    };
  }

  /**
   * 查询单个用户详情
   * @param userId
   */
  async findOne(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true, // 包含钱包信息
        // 最近使用的5个设备
        devices: {
          take: 5,
          orderBy: {
            lastActiveAt: 'desc',
          },
        },
        // 最近的5条登录日志
        loginLogs: {
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    return user;
  }

  /**
   * 更新用户状态（封号/解冻）
   * @param id
   * @param dto
   */
  async updateUserStatus(id: string, dto: UpdateUserStatusDto) {
    /*const { status } = dto;
    await this.prismaService.user.update({
      where: { id },
      data: {
        status,
      },
    });*/
  }

  /**
   * 获取用户设备列表及其封禁状态
   * @param userId
   */
  async getUserDevices(userId: string) {
    // 查询用户的所有设备信息
    const devices = await this.prismaService.userDevice.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
    });

    // 2. 查黑名单表 (取出所有被拉黑的 IDs)
    // 优化：收集所有 deviceId 一次性查询'
    const deviceIds = devices.map((d) => d.deviceId);
    const blacklisted = await this.prismaService.deviceBlacklist.findMany({
      where: { deviceId: { in: deviceIds } },
      select: {
        deviceId: true,
        reason: true,
      },
    });

    // 3. 内存匹配，给前端返回 isBanned 标记
    const blacklistMap = new Map(
      blacklisted.map((b) => [b.deviceId, b.reason]),
    );
    return devices.map((device) => ({
      ...device,
      isBanned: blacklistMap.has(device.deviceId),
      banReason: blacklistMap.get(device.deviceId) || null,
    }));
  }

  /**
   * 设备拉黑
   * @param dto
   * @param adminId
   */
  async banDevice(dto: BanDeviceDto, adminId: string) {
    const { deviceId, reason } = dto;
    try {
      await this.prismaService.deviceBlacklist.create({
        data: {
          deviceId: deviceId,
          reason: reason,
          // operator: adminId // 如果表里加了操作人字段
        },
      });
      return { success: true };
    } catch (error: any) {
      if (error.code === 'P2002') {
        if (error.code === 'P2002') {
          throw new ConflictException('Device is already banned');
        }
        throw error;
      }
    }
  }

  /**
   * 设备解封
   * @param deviceId
   */
  async unbanDevice(deviceId: string) {
    try {
      await this.prismaService.deviceBlacklist.delete({
        where: { deviceId },
      });
      return { success: true };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Device is not banned');
      }
      throw error;
    }
  }
}
