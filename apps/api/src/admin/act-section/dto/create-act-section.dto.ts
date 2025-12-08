import {
  IsDate,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToNumber } from '@api/common/dto/transforms';
import { Type } from 'class-transformer';

export class CreateActSectionDto {
  @ApiProperty({
    description: 'key',
    example: 'home_new_arrival',
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  key!: string;

  @ApiProperty({ description: 'title', example: 'New Arrival', type: 'string' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  title!: string;

  @ApiProperty({
    description: 'images show type',
    example: '1',
    type: 'number',
  })
  @ToNumber()
  @IsInt()
  @IsNotEmpty()
  imgStyleType!: number;

  @ApiPropertyOptional({ description: 'start time' })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  startAt?: Date;

  @ApiPropertyOptional({ description: 'end time' })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  endAt?: Date;

  @ApiPropertyOptional({ description: 'sort order', default: 0 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({
    description: 'status',
    example: 1,
    type: 'number',
  })
  @ToNumber()
  @IsInt()
  @IsNotEmpty()
  @IsIn([0, 1], { message: 'status must be 0(INACTIVE) or 1(ACTIVE)' })
  status!: number;

  @ApiProperty({
    description: 'limit',
    example: 10,
    type: 'number',
  })
  @ToNumber()
  @IsInt()
  @IsNotEmpty()
  @Min(10, { message: 'limit must be at least 1' })
  limit!: number;
}
