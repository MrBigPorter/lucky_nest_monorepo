import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { QueryAdsDto } from './dto/query-ads.dto';
import { CreateAdDto, UpdateAdDto } from './dto/create-update-ad.dto';

@Injectable()
export class AdsService {
  constructor(private readonly prisma: PrismaService) {}

  async getList(dto: QueryAdsDto) {
    const { page = 1, pageSize = 20, status, adPosition } = dto;

    const where: Prisma.AdvertisementWhereInput = {};
    if (status !== undefined) where.status = status;
    if (adPosition !== undefined) where.adPosition = adPosition;

    const [total, list] = await Promise.all([
      this.prisma.advertisement.count({ where }),
      this.prisma.advertisement.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      list: list.map((ad) => ({
        ...ad,
        startTime: ad.startTime?.getTime() ?? null,
        endTime: ad.endTime?.getTime() ?? null,
        createdAt: ad.createdAt.getTime(),
        updatedAt: ad.updatedAt.getTime(),
      })),
      total,
      page,
      pageSize,
    };
  }

  async create(dto: CreateAdDto) {
    const ad = await this.prisma.advertisement.create({
      data: {
        title: dto.title,
        fileType: dto.fileType,
        img: dto.img,
        videoUrl: dto.videoUrl,
        adPosition: dto.adPosition,
        sortOrder: dto.sortOrder ?? 0,
        jumpUrl: dto.jumpUrl,
        relatedId: dto.relatedId,
        jumpCate: dto.jumpCate,
        startTime: dto.startTime ? new Date(dto.startTime) : null,
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        status: dto.status ?? 1,
      },
    });
    return {
      ...ad,
      startTime: ad.startTime?.getTime() ?? null,
      endTime: ad.endTime?.getTime() ?? null,
    };
  }

  async update(id: string, dto: UpdateAdDto) {
    const existing = await this.prisma.advertisement.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Advertisement not found');

    const ad = await this.prisma.advertisement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.fileType !== undefined && { fileType: dto.fileType }),
        ...(dto.img !== undefined && { img: dto.img }),
        ...(dto.videoUrl !== undefined && { videoUrl: dto.videoUrl }),
        ...(dto.adPosition !== undefined && { adPosition: dto.adPosition }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.jumpUrl !== undefined && { jumpUrl: dto.jumpUrl }),
        ...(dto.relatedId !== undefined && { relatedId: dto.relatedId }),
        ...(dto.jumpCate !== undefined && { jumpCate: dto.jumpCate }),
        ...(dto.startTime !== undefined && {
          startTime: dto.startTime ? new Date(dto.startTime) : null,
        }),
        ...(dto.endTime !== undefined && {
          endTime: dto.endTime ? new Date(dto.endTime) : null,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
    return {
      ...ad,
      startTime: ad.startTime?.getTime() ?? null,
      endTime: ad.endTime?.getTime() ?? null,
    };
  }

  async toggleStatus(id: string) {
    const existing = await this.prisma.advertisement.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Advertisement not found');
    return this.prisma.advertisement.update({
      where: { id },
      data: { status: existing.status === 1 ? 0 : 1 },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.advertisement.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Advertisement not found');
    await this.prisma.advertisement.delete({ where: { id } });
    return { success: true };
  }
}
