import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import {
  BindFlashSaleProductDto,
  CreateFlashSaleSessionDto,
  UpdateFlashSaleProductDto,
  UpdateFlashSaleSessionDto,
} from './dto/flash-sale.dto';

@Injectable()
export class FlashSaleService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 场次 ─────────────────────────────────────────────────────────

  async getSessions() {
    const sessions = await this.prisma.flashSaleSession.findMany({
      orderBy: { startTime: 'desc' },
      include: { _count: { select: { products: true } } },
    });
    return {
      list: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        startTime: s.startTime.getTime(),
        endTime: s.endTime.getTime(),
        status: s.status,
        productCount: s._count.products,
      })),
    };
  }

  async createSession(dto: CreateFlashSaleSessionDto) {
    const session = await this.prisma.flashSaleSession.create({
      data: {
        title: dto.title,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        status: dto.status ?? 1,
      },
    });
    return {
      ...session,
      startTime: session.startTime.getTime(),
      endTime: session.endTime.getTime(),
    };
  }

  async updateSession(id: string, dto: UpdateFlashSaleSessionDto) {
    const existing = await this.prisma.flashSaleSession.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Flash sale session not found');
    const session = await this.prisma.flashSaleSession.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.startTime !== undefined && {
          startTime: new Date(dto.startTime),
        }),
        ...(dto.endTime !== undefined && { endTime: new Date(dto.endTime) }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
    return {
      ...session,
      startTime: session.startTime.getTime(),
      endTime: session.endTime.getTime(),
    };
  }

  async deleteSession(id: string) {
    const existing = await this.prisma.flashSaleSession.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Flash sale session not found');
    await this.prisma.flashSaleProduct.deleteMany({ where: { sessionId: id } });
    await this.prisma.flashSaleSession.delete({ where: { id } });
    return { success: true };
  }

  // ── 场次商品 ─────────────────────────────────────────────────────

  async getSessionProducts(sessionId: string) {
    const session = await this.prisma.flashSaleSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');

    const products = await this.prisma.flashSaleProduct.findMany({
      where: { sessionId },
      orderBy: { sortOrder: 'asc' },
      include: {
        treasure: {
          select: {
            treasureId: true,
            treasureName: true,
            unitAmount: true,
            treasureCoverImg: true,
          },
        },
      },
    });

    return {
      list: products.map((p) => ({
        id: p.id,
        treasureId: p.treasureId,
        flashStock: p.flashStock,
        flashPrice: p.flashPrice.toString(),
        sortOrder: p.sortOrder,
        product: p.treasure,
      })),
    };
  }

  async bindProduct(sessionId: string, dto: BindFlashSaleProductDto) {
    const session = await this.prisma.flashSaleSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');

    const treasure = await this.prisma.treasure.findUnique({
      where: { treasureId: dto.treasureId },
    });
    if (!treasure) throw new NotFoundException('Product not found');

    return this.prisma.flashSaleProduct.create({
      data: {
        sessionId,
        treasureId: dto.treasureId,
        flashPrice: dto.flashPrice,
        flashStock: dto.flashStock ?? 0,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateProduct(productId: string, dto: UpdateFlashSaleProductDto) {
    const existing = await this.prisma.flashSaleProduct.findUnique({
      where: { id: productId },
    });
    if (!existing) throw new NotFoundException('Flash sale product not found');
    return this.prisma.flashSaleProduct.update({
      where: { id: productId },
      data: {
        ...(dto.flashPrice !== undefined && { flashPrice: dto.flashPrice }),
        ...(dto.flashStock !== undefined && { flashStock: dto.flashStock }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async removeProduct(productId: string) {
    const existing = await this.prisma.flashSaleProduct.findUnique({
      where: { id: productId },
    });
    if (!existing) throw new NotFoundException('Flash sale product not found');
    await this.prisma.flashSaleProduct.delete({ where: { id: productId } });
    return { success: true };
  }
}
