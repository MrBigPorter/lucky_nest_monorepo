import { IsInt, IsNumber, IsOptional } from 'class-validator';
import { ToNumber } from '@api/common/dto/transforms';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdQueryDto {
  @ApiPropertyOptional({
    description:
      'Ad position: 1 - Home top, 2 - Home middle, 3 - Category page, 4 - Detail page',
    example: 1,
    type: Number,
  })
  @ToNumber()
  @IsNumber()
  @IsInt()
  adPosition: number = 1;

  @ApiPropertyOptional({
    description: 'Status: 0 - disabled, 1 - enabled',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @IsInt()
  status?: number = 1;

  @ApiPropertyOptional({
    description: 'Limit the number of returned items',
    example: 10,
    type: Number,
  })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @IsInt()
  limit?: number = 10;
}
