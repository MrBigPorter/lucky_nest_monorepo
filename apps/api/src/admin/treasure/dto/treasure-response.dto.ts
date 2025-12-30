import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type, Transform } from 'class-transformer';
import { DateToTimestamp } from '@api/common/dto/transforms';

//  定义简化的分类信息
export class TreasureCategoryResponseDto {
  @ApiProperty({ description: '分类ID' })
  @Expose()
  id!: number;

  @ApiProperty({ description: '分类名称' })
  @Expose()
  name!: string;
}

//  定义商品主体返回信息
@Exclude()
export class TreasureResponseDto {
  // ==========================
  // 1. 基础信息 (原有)
  // ==========================
  @ApiProperty({ description: '产品ID' })
  @Expose()
  treasureId!: string;

  @ApiProperty({ description: '产品名称' })
  @Expose()
  treasureName!: string;

  @ApiProperty({ description: '实物名称' })
  @Expose()
  productName?: string;

  @ApiProperty({ description: '成本价' })
  @Expose()
  @Transform(({ value }) => (value ? Number(value) : 0))
  costAmount!: number;

  @ApiProperty({ description: '单价' })
  @Expose()
  @Transform(({ value }) => (value ? Number(value) : 0))
  unitAmount!: number;

  @ApiProperty({ description: '总库存' })
  @Expose()
  seqShelvesQuantity!: number;

  @ApiProperty({ description: '已售数量' })
  @Expose()
  seqBuyQuantity!: number;

  @ApiProperty({ description: '购买进度(%)', example: 50.5 })
  @Expose()
  @Transform(({ value }) => (value ? Number(value) : 0))
  buyQuantityRate!: number;

  @ApiProperty({ description: '封面图' })
  @Expose()
  treasureCoverImg?: string;

  @ApiProperty({ description: '状态: 0-下架 1-上架' })
  @Expose()
  state!: number;

  // ==========================
  // 2. [新增] 物流与拼团配置 (必须加，否则前端看不见)
  // ==========================

  @ApiProperty({ description: '物流类型: 1-实物 2-无需物流', example: 1 })
  @Expose()
  shippingType?: number;

  @ApiProperty({ description: '重量(kg)', example: 0.5 })
  @Expose()
  @Transform(({ value }) => (value ? Number(value) : 0))
  weight?: number;

  @ApiProperty({ description: '成团人数', example: 5 })
  @Expose()
  groupSize?: number;

  @ApiProperty({ description: '成团时效(秒)', example: 86400 })
  @Expose()
  groupTimeLimit?: number;

  @ApiProperty({ description: '赠品配置JSON' })
  @Expose()
  bonusConfig?: any; // 这里直接透传 JSON 对象给前端

  // ==========================
  // 3. [新增] 预售时间 (必须加，用于前端倒计时)
  // ==========================

  @ApiProperty({ description: '销售开始时间戳', example: 1709628000000 })
  @Expose()
  @DateToTimestamp()
  salesStartAt?: number;

  @ApiProperty({ description: '销售结束时间戳', example: 1709628000000 })
  @Expose()
  @DateToTimestamp()
  salesEndAt?: number;

  // ==========================
  // 4. 系统时间
  // ==========================

  @ApiProperty({ description: '创建时间', example: 1709628000000 })
  @Expose()
  @DateToTimestamp()
  createdAt!: number;

  @ApiProperty({ description: '更新时间', example: 1709628000000 })
  @Expose()
  @DateToTimestamp()
  updatedAt!: number;

  @ApiProperty({ description: '状态标签', example: 'ACTIVE' })
  @Expose()
  statusTag!: string;

  @ApiProperty({ type: [TreasureCategoryResponseDto], description: '所属分类' })
  @Expose()
  @Transform(({ value }) => {
    return (
      value?.map((item: any) => ({
        // 兼容处理：这里处理 prisma 多级 include 返回的结构
        id: item.category?.products_category_id || item.category?.id,
        name: item.category?.name,
      })) || []
    );
  })
  categories!: TreasureCategoryResponseDto[];
}
