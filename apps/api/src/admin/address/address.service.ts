import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import {
  AdminQueryAddressDto,
  AdminUpdateAddressDto,
} from '@api/admin/address/dto/admin-address.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AddressService {
  constructor(private prismaService: PrismaService) {}

  /**
   * 私有辅助：地理信息校验
   * 确保 Admin 不会录入不存在的区域或脏数据
   */
  private async validateAndGetGeoInfo(
    provinceId?: number,
    cityId?: number,
    barangayId?: number,
  ) {
    // 如果没有传任何地理 ID，说明不修改地址区域
    if (!provinceId && !cityId && !barangayId) return null;

    if (!provinceId || !cityId || !barangayId) {
      throw new BadRequestException(
        'Province, City, and Barangay must be updated together',
      );
    }

    const barangay = await this.prismaService.barangay.findUnique({
      where: { barangayId },
      include: {
        city: {
          include: { province: true },
        },
      },
    });

    if (!barangay) throw new BadRequestException('Invalid Barangay ID');

    if (barangay.cityId !== cityId || barangay.city.provinceId !== provinceId) {
      throw new BadRequestException('Geo location mismatch');
    }

    return {
      province: barangay.city.province.provinceName,
      city: barangay.city.cityName,
      barangay: barangay.barangayName,
      postalCode: barangay.city.postalCode,
    };
  }

  /**
   * Admin 获取用户地址列表，支持多条件筛选
   * @param dto
   */
  async list(dto: AdminQueryAddressDto) {
    const { userId, page, pageSize, phone, province, keyword } = dto;
    const skip = (page - 1) * pageSize;

    const whereConditions: Prisma.UserAddressWhereInput = {};

    if (phone) {
      whereConditions.phone = { contains: phone };
    }
    if (province) {
      whereConditions.province = { contains: province };
    }
    if (userId) {
      whereConditions.userId = userId;
    }
    if (keyword) {
      whereConditions.OR = [
        { firstName: { contains: keyword } },
        { lastName: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    const [total, list] = await this.prismaService.$transaction([
      this.prismaService.userAddress.count({ where: whereConditions }),
      this.prismaService.userAddress.findMany({
        where: whereConditions,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }, //通常按时间倒序看最新的
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      list,
    };
  }

  /**
   * Admin 更新用户地址信息
   * @param addressId
   * @param dto
   */
  async update(addressId: string, dto: AdminUpdateAddressDto) {
    const address = await this.prismaService.userAddress.findUnique({
      where: { addressId },
      select: {
        userId: true,
      },
    });
    if (!address) {
      throw new BadRequestException('Address not found');
    }

    const geo = await this.validateAndGetGeoInfo(
      dto.provinceId,
      dto.cityId,
      dto.barangayId,
    );

    return this.prismaService.$transaction(async (ctx) => {
      // if isDefault is being set to true, unset other default addresses for the user
      if (dto.isDefault === 1) {
        await ctx.userAddress.updateMany({
          where: {
            userId: address?.userId,
            isDefault: 1,
            addressId: { not: addressId },
          },
          data: { isDefault: 0 },
        });
      }

      // update the address
      return ctx.userAddress.update({
        where: { addressId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          ...(geo && {
            province: geo.province,
            city: geo.city,
            barangay: geo.barangay,
            postalCode: geo.postalCode,
          }),
          fullAddress: dto.fullAddress,
          isDefault: dto.isDefault,
        },
      });
    });
  }

  /**
   * Admin 删除用户地址
   * @param addressId
   */
  async delete(addressId: string) {
    try {
      await this.prismaService.userAddress.delete({
        where: { addressId },
      });
      return { success: true };
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new BadRequestException('Address not found');
      }
      throw error;
    }
  }

  /**
   * Admin 获取用户地址详情
   * @param addressId
   */
  async detail(addressId: string) {
    const address = await this.prismaService.userAddress.findUnique({
      where: { addressId },
      include: {
        user: {
          select: {
            nickname: true,
            phone: true,
          },
        },
      },
    });

    if (!address) {
      throw new BadRequestException('Address not found');
    }
    return address;
  }
}
