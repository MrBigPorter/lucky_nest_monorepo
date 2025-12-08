import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Max } from 'class-validator';
import { ToNumber } from '@api/common/dto/transforms';

export class QueryActSectionDto {
  @ApiProperty({ description: 'page number', example: 1, type: 'number' })
  @IsNotEmpty()
  @ToNumber()
  @IsInt()
  page!: number;

  @ApiProperty({ description: 'page size', example: 10, type: 'number' })
  @IsNotEmpty()
  @ToNumber()
  @IsInt()
  @Max(100, { message: 'pageSize must not be greater than 100' })
  pageSize!: number;
}
