import { IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToNumber } from '@api/common/dto/transforms';

export class CreateCategoryDto {
  @ApiProperty({ description: 'name', example: 'test', type: 'string' })
  @IsOptional()
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'nameEn',
    example: 'test',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional({ description: 'icon', example: 'test', type: 'string' })
  @IsOptional()
  @IsString()
  @IsUrl()
  icon?: string;

  @ApiPropertyOptional({ description: 'sortOrder', example: 1, type: 'number' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  sortOrder?: number = 99;

  @ApiPropertyOptional({ description: 'status', example: 1, type: 'number' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  @Max(1)
  state?: number = 1;
}
