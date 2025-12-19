import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';

@Injectable()
export class RegionService {
  constructor(private prismaService: PrismaService) {}

  /**
   * Get active provinces
   */
  async getProvinces() {
    return this.prismaService.province.findMany({
      where: {
        status: 1,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  /**
   * Get active cities within a province
   * @param provinceId
   */
  async getCities(provinceId: number) {
    return this.prismaService.city.findMany({
      where: {
        provinceId,
        status: 1,
      },
      orderBy: {
        cityName: 'asc',
      },
    });
  }

  /**
   * Get active barangays within a city
   * @param cityId
   */
  async getBarangays(cityId: number) {
    return this.prismaService.barangay.findMany({
      where: {
        cityId,
        status: 1,
      },
      orderBy: {
        barangayName: 'asc',
      },
    });
  }

  /**
   * Validate and get full geo info
   * @param provinceId
   * @param cityId
   * @param barangayId
   */
  async validateAndGetGeoInfo(
    provinceId: number,
    cityId: number,
    barangayId: number,
  ) {
    // 1. 查最底层的 Barangay (带出上级)
    const barangay = await this.prismaService.barangay.findUnique({
      where: { barangayId },
      include: {
        city: {
          include: { province: true },
        },
      },
    });

    // 2. 校验是否存在
    if (!barangay) {
      throw new BadRequestException(`Barangay ID ${barangayId} invalid`);
    }

    // 3. 校验层级匹配 (防止传了宿务的省ID，却传了马尼拉的市ID)
    if (barangay.cityId !== cityId) {
      throw new BadRequestException(
        `City ID ${cityId} does not match Barangay`,
      );
    }
    if (barangay.city.provinceId !== provinceId) {
      throw new BadRequestException(
        `Province ID ${provinceId} does not match City`,
      );
    }

    // 4. 返回标准数据
    return {
      province: barangay.city.province.provinceName,
      city: barangay.city.cityName,
      barangay: barangay.barangayName,
      postalCode: barangay.city.postalCode,
    };
  }
}
