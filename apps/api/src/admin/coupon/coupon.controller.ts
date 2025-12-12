import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { RolesGuard } from '@api/common/guards/roles.guard';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { Roles } from '@api/common/decorators/roles.decorator';
import { Role } from '@lucky/shared';
import {
  CouponListResponseDto,
  CouponResponseDto,
} from '@api/admin/coupon/dto/coupon-response.dto';
import { plainToInstance } from 'class-transformer';
import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';
import { QueryCouponDto } from '@api/admin/coupon/dto/query-coupon.dto';
import { UpdateCouponDto } from '@api/admin/coupon/dto/update-coupon.dto';

@ApiTags('Admin Coupon Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  /**
   * Create a new coupon
   * @param dto
   * @return Created coupon
   */
  @Post('create')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: CouponResponseDto })
  async createCoupon(@Body() dto: CreateCouponDto) {
    const coupon = await this.couponService.create(dto);
    return plainToInstance(CouponResponseDto, coupon, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get a paginated list of coupons with optional filters
   * @param dto
   * @returns Paginated list of coupons
   *
   */
  @Get('list')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.VIEWER)
  @ApiResponse({ type: CouponListResponseDto })
  @ApiExtraModels(PaginatedResponseDto, CouponResponseDto)
  async findAll(@Query() dto: QueryCouponDto) {
    const result = await this.couponService.findAll(dto);
    return {
      ...result,
      list: plainToInstance(CouponResponseDto, result.list, {
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Get coupon details by ID
   * @param id
   * @returns Coupon details
   */
  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.VIEWER)
  @ApiResponse({ type: CouponResponseDto })
  async findOne(@Param('id') id: string) {
    const coupon = await this.couponService.finOne(id);
    return plainToInstance(CouponResponseDto, coupon, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Update coupon details
   * @param id
   * @param dto
   * @returns Updated coupon
   */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.ADMIN)
  @ApiResponse({ type: CouponResponseDto })
  async updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    const coupon = await this.couponService.update(id, dto);
    return plainToInstance(CouponResponseDto, coupon, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Delete a coupon by ID
   * @param id
   * @return Deleted coupon
   */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiResponse({ type: CouponResponseDto })
  async remove(@Param('id') id: string) {
    const coupon = await this.couponService.remove(id);
    return plainToInstance(CouponResponseDto, coupon, {
      excludeExtraneousValues: true,
    });
  }
}
