import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type, Transform } from 'class-transformer';

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

  @ApiProperty({ description: '创建时间', example: 1709628000000 })
  @Expose()
  @Transform(({ value }) => {
    return value instanceof Date ? value.getTime() : value;
  })
  createdAt!: number;

  @ApiProperty({ description: '更新时间', example: 1709628000000 })
  @Expose()
  @Transform(({ value }) => {
    return value instanceof Date ? value.getTime() : value;
  })
  updatedAt!: number;

  @ApiProperty({ type: [TreasureCategoryResponseDto], description: '所属分类' })
  @Expose()
  @Transform(({ value }) => {
    return (
      value?.map((item: any) => ({
        id: item.category?.products_category_id || item.category?.id,
        name: item.category?.name,
      })) || []
    );
  })
  categories!: TreasureCategoryResponseDto[];
}
