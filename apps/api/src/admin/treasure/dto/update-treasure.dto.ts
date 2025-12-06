import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ToNumber } from '@api/common/dto/transforms';

export class UpdateTreasureDto {
  @ApiProperty({
    description: 'treasure name',
    example: 'iphone 15 pro max',
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  treasureName!: string;

  @ApiProperty({ description: 'cost price', example: '1000', type: 'number' })
  @IsNotEmpty()
  @ToNumber()
  @IsNumber()
  @Min(0)
  costAmount!: number;

  @ApiProperty({ description: 'price/unit', example: '100', type: 'number' })
  @IsNotEmpty()
  @ToNumber()
  @IsNumber()
  @Min(0.01)
  unitAmount!: number;

  @ApiProperty({
    description: 'total quantity',
    example: '10',
    type: 'number',
  })
  @IsNotEmpty()
  @ToNumber()
  @IsNumber()
  @Min(0)
  seqShelvesQuantity!: number;

  @ApiProperty({ description: 'category id', example: [1, 2], type: 'number' })
  @IsArray()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  @IsInt({ each: true })
  categoryIds!: number[];

  @ApiProperty({
    description: 'treasure image',
    example: 'http://ww.jpg',
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  treasureCoverImg!: string;

  @ApiPropertyOptional({ description: 'about the detail' })
  @IsOptional()
  @IsString()
  desc?: string;
}
