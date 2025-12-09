import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { CreateBannerDto } from '@api/admin/banner/dto/create-banner.dto';
import { BANNER_STATE, BANNER_VALID_STATE } from '@lucky/shared';
import { QueryBannerDto } from '@api/admin/banner/dto/query-banner.dto';
import { Prisma } from '@prisma/client';
import { UpdateBannerDto } from '@api/admin/banner/dto/update-banner.dto';

@Injectable()
export class BannerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new banner
   * @param dto
   * @returns {Promise<any>}
   */
  async create(dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        ...dto,
        state: BANNER_STATE.ACTIVE,
        validState: BANNER_VALID_STATE.VALID,
      },
    });
  }

  /**
   * Get banner list with pagination
   * @param dto
   * @returns {Promise<{list: any[], pageSize: number, page: number, total: number}>}
   */
  async findAll(dto: QueryBannerDto) {
    const { page, pageSize, bannerCate } = dto;
    const skip = (page - 1) * pageSize;

    const whereCondition: Prisma.BannerWhereInput = {};
    if (bannerCate) {
      whereCondition.bannerCate = bannerCate;
    }

    const [total, list] = await this.prisma.$transaction([
      this.prisma.banner.count(),
      this.prisma.banner.findMany({
        where: whereCondition,
        skip,
        take: pageSize,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    return { list, pageSize, page, total };
  }

  /**
   * Get a single banner by id
   * @param id
   * @returns {Promise<any>}
   */
  async findOne(id: string) {
    const banner = await this.prisma.banner.findUnique({
      where: { id },
    });

    if (!banner) {
      throw new NotFoundException(`Banner with id ${id} not found`);
    }

    return banner;
  }

  /**
   * Update a banner by id
   * @param id
   * @param dto
   */
  async update(id: string, dto: UpdateBannerDto) {
    const banner = await this.findOne(id);

    try {
      return this.prisma.banner.update({
        where: { id },
        data: {
          ...dto,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Banner with id ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Delete a banner by id
   * @param id
   */
  async remove(id: string) {
    const banner = await this.findOne(id);
    if (banner.state === BANNER_STATE.ACTIVE) {
      throw new BadRequestException(
        `Cannot delete an active banner, deactivate it first`,
      );
    }

    return this.prisma.banner.delete({
      where: { id },
    });
  }
}
