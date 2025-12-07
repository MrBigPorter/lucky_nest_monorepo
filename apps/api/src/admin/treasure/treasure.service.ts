import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { CreateTreasureDto } from '@api/admin/treasure/dto/create-treasure.dto';
import { TREASURE_STATE } from '@lucky/shared';
import { Prisma } from '@prisma/client';
import { QueryTreasureDto } from '@api/admin/treasure/dto/query-treasure.dto';
import { UpdateTreasureDto } from '@api/admin/treasure/dto/update-treasure.dto';

@Injectable()
export class TreasureService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new treasure
   * @param dto
   * @returns Promise<Treasure>
   *
   */
  async create(dto: CreateTreasureDto) {
    const { categoryIds, ...rest } = dto;

    try {
      return this.prisma.treasure.create({
        data: {
          ...rest,
          seqBuyQuantity: 0, // default sell to 0
          state: TREASURE_STATE.ACTIVE, // default to active

          // prisma auto fill up the treasureId to categories
          // bind product to categories
          categories: {
            create: categoryIds.map((id) => ({
              category: {
                connect: { id }, // bind product to categories
              },
            })),
          },
        },
        // return include category info
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });
    } catch (error) {
      // 捕获“分类不存在”的错误
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2025 是 Prisma 的 "Record not found" 错误码
        if (error.code === 'P2025') {
          throw new Error('Category not found');
        }
      }
      throw error;
    }
  }

  /**
   * Find all treasures with pagination
   * @param dto
   * @returns Promise<{ list: Treasure[], page: number, pageSize: number, total: number }>
   */
  async findAll(dto: QueryTreasureDto) {
    const { page, pageSize, categoryId } = dto;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // define where condition first
    const whereCondition: Prisma.TreasureWhereInput = {};
    if (categoryId) {
      whereCondition.categories = {
        some: {
          categoryId: categoryId,
        },
      };
    }

    if (dto.treasureName) {
      whereCondition.treasureName = {
        contains: dto.treasureName, //包含字符串
        mode: 'insensitive', // 忽略大小写
      };
    }

    const [list, total] = await this.prisma.$transaction([
      this.prisma.treasure.findMany({
        where: whereCondition,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      }),
      this.prisma.treasure.count({ where: whereCondition }),
    ]);

    return {
      list: list.map((item) => ({
        ...item,
        createdAt: item.createdAt.getTime(),
        updatedAt: item.updatedAt.getTime(),
      })),
      page,
      pageSize,
      total,
    };
  }

  /**
   * Find one treasure by id
   * @param id
   * @returns Promise<Treasure>
   */
  async findOne(id: string) {
    const item = await this.prisma.treasure.findUnique({
      where: {
        treasureId: id,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
    if (!item) throw new NotFoundException(`Treasure with id ${id} not found`);
    return item;
  }

  /**
   * Update a treasure by id
   * @param id
   * @param dto
   * @returns Promise<Treasure>
   */
  async update(id: string, dto: UpdateTreasureDto) {
    // check treasure
    await this.findOne(id);

    const { categoryIds, ...rest } = dto;

    return this.prisma.treasure.update({
      where: { treasureId: id },
      data: {
        ...rest,
        //关联更新策略：如果有传新分类，就重置关联
        ...(categoryIds && {
          categories: {
            deleteMany: {}, // 1. 先把这商品从旧货架拿下来 (清空旧关联)
            create: categoryIds.map((id) => ({
              category: {
                connect: { id }, // 2. 再放到新货架上去
              },
            })),
          },
        }),
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  /**
   * Update treasure state
   * @param id
   * @param state
   * @returns Promise<Treasure>
   */
  async updateState(id: string, state: number) {
    const treasure = await this.findOne(id);
    if (!treasure) {
      throw new BadRequestException('Treasure not found');
    }

    if (treasure.state === state) {
      return treasure;
    }

    return this.prisma.treasure.update({
      where: { treasureId: id },
      data: {
        state,
      },
    });
  }

  /**
   * Delete a treasure by id
   * @param id
   * @returns Promise<Treasure>
   */
  async remove(id: string) {
    const hasOrder = await this.prisma.order.findFirst({
      where: { treasureId: id },
    });

    if (hasOrder) {
      throw new BadRequestException(
        'this treasure has order, can not delete, please change the state to inactive',
      );
    }

    return this.prisma.treasure.delete({
      where: { treasureId: id },
    });
  }
}
