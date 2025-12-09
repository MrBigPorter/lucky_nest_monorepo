import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ToNumber } from '@api/common/dto/transforms';
import { Transform } from 'class-transformer';

export class CreateBannerDto {
  @ApiProperty({ description: 'Banner title', example: 'Summer Sale' })
  @IsNotEmpty({ message: 'Title must not be empty' })
  @IsString()
  @MaxLength(100)
  title!: string;

  @ApiProperty({
    description: 'Banner image URL',
    example: 'https://example.com/banner.jpg',
  })
  @IsNotEmpty({ message: 'Banner image URL must not be empty' })
  @IsUrl({}, { message: 'Banner image URL must be a valid URL' })
  @MaxLength(255)
  @IsString()
  bannerImgUrl!: string;

  @ApiProperty({ description: 'File type', example: 1 })
  @IsNotEmpty({ message: 'File type must not be empty' })
  @ToNumber()
  @IsInt({ message: 'File type must be an integer' })
  @IsIn([1, 2], { message: 'File type must be either 1 or 2' })
  fileType!: number;

  @ApiProperty({
    description: 'Banner category, 1 home, 2 activity 3 product',
    example: 3,
  })
  @IsNotEmpty({ message: 'Banner category must not be empty' })
  @ToNumber()
  @IsInt({ message: 'Banner category must be an integer' })
  @IsIn([1, 2, 3, 4], {
    message: 'Banner category must be one of 1, 2, 3, or 4',
  })
  bannerCate!: number;

  @ApiProperty({
    description: 'Jump category, 1 no, 2 inner 3 external',
    example: 1,
  })
  @IsNotEmpty({ message: 'Jump category must not be empty' })
  @ToNumber()
  @IsInt({ message: 'Jump category must be an integer' })
  @IsIn([1, 2, 3], {
    message: 'Jump category must be either 1 or 2',
  })
  jumpCate?: number;

  @ApiProperty({ description: 'Jump URL', example: 'https://example.com' })
  @IsOptional()
  @IsUrl({}, { message: 'Jump URL must be a valid URL' })
  @MaxLength(255)
  @IsString()
  jumpUrl?: string;

  @ApiProperty({ description: 'Sort order', example: 1 })
  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'Sort order must be an integer' })
  sortOrder?: number;

  @ApiProperty({ description: ' Active start time', example: '177786786867' })
  @IsOptional()
  activityAtStart?: Date;

  @ApiProperty({ description: 'Active end time', example: '177786786867' })
  @IsOptional()
  activityAtEnd?: Date;
}
