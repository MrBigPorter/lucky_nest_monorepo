import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentChannelService {
  private readonly logger = new Logger(PaymentChannelService.name);
  constructor(private prismaService: PrismaService) {}

  /**
   * Create a new payment channel
   * @param dto
   */
  async create(dto: CreateChannelDto) {
    try {
      return await this.prismaService.paymentChannel.create({
        data: {
          ...dto,
          fixedAmounts: dto.fixedAmounts ? (dto.fixedAmounts as any) : null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new Error('Payment channel with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Get a paginated list of payment channels with optional type filter
   * @param page
   * @param pageSize
   * @param type
   */
  async findAll(page: number, pageSize: number, type?: number) {
    const skip = (page - 1) * pageSize;
    const whereConditions: Prisma.PaymentChannelWhereInput = {};

    if (type !== undefined) {
      whereConditions.type = type;
    }

    const [total, list] = await this.prismaService.$transaction([
      this.prismaService.paymentChannel.count({
        where: whereConditions,
      }),
      this.prismaService.paymentChannel.findMany({
        where: whereConditions,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);
    return { total, page, pageSize, list };
  }

  /**
   * Update an existing payment channel
   * @param id
   * @param dto
   */
  async update(id: number, dto: Partial<CreateChannelDto>) {
    try {
      return await this.prismaService.paymentChannel.update({
        where: { id },
        data: {
          ...dto,
          fixedAmounts: dto.fixedAmounts ? (dto.fixedAmounts as any) : null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new NotFoundException(`Channel #${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Update the status of a payment channel
   * @param id
   * @param status
   */
  async updateStatus(id: number, status: number) {
    // check if channel exists
    const channel = await this.prismaService.paymentChannel.findUnique({
      where: { id },
    });
    if (!channel) {
      throw new NotFoundException(`Channel #${id} not found`);
    }
    if (channel.status === status) {
      return channel; // No change needed
    }
    return this.prismaService.paymentChannel.update({
      where: { id },
      data: { status: status },
    });
  }

  /**
   * Get client configuration for active payment channels of a specific type
   * @param type
   */
  async getClientConfig(type: number) {
    const channels = await this.prismaService.paymentChannel.findMany({
      where: { type, status: 1 },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        code: true,
        name: true,
        icon: true,
        minAmount: true,
        maxAmount: true,
        fixedAmounts: true,
        feeFixed: true, // 提现需要展示手续费
        isCustom: true,
      },
    });
  }
}
