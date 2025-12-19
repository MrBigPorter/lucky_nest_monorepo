import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  Matches,
  Max,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';
import { ToInt } from '@api/common/dto/transforms';

@Exclude()
export class CreateAddressDto {
  @ApiProperty({ description: 'Last name', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Expose()
  lastName!: string;

  @ApiProperty({ description: 'First name', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Expose()
  firstName!: string;

  @ApiProperty({ description: 'Phone number', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  // 简单的 PH 手机号正则
  @Matches(/^(09|\+639)\d{9}$/, { message: 'Invalid phone number format' })
  @Expose()
  phone!: string;

  @ApiProperty({ description: 'Province ID' })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  @Expose()
  provinceId!: number;

  @ApiProperty({ description: 'City ID' })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  @Expose()
  cityId!: number;

  @ApiProperty({ description: 'Barangay ID' })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  @Expose()
  barangayId!: number;

  @ApiProperty({ description: 'Full address', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @Expose()
  fullAddress!: string;

  @ApiPropertyOptional({
    description: 'Address label (e.g., Home, Office)',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Expose()
  label?: string;

  @ApiPropertyOptional({ description: 'Is default address', default: 0 })
  @IsOptional()
  @ToInt()
  @IsInt()
  @Min(0)
  @Max(1)
  @Expose()
  isDefault?: number;
}

export class UpdateAddressDto extends CreateAddressDto {}

export class DeleteAddressDto {
  @ApiProperty({ description: 'Address ID to delete' })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  addressId!: string;
}

export class QueryAddressListDto {
  @ApiProperty({ description: 'Page number', example: 1 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  page!: number;

  @ApiProperty({ description: 'Page size', example: 10 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize!: number;
}

@Exclude()
export class AddressResponseDto {
  @ApiProperty({ description: 'Address ID' })
  @Expose()
  addressId!: string;

  @ApiProperty({ description: 'First name' })
  @Expose()
  firstName!: string;

  @ApiProperty({ description: 'Province Name' })
  @Expose()
  province!: string;

  @ApiProperty({ description: 'City Name' })
  @Expose()
  city!: string;

  @ApiProperty({ description: 'Barangay Name' })
  @Expose()
  barangay!: string;

  @ApiProperty({ description: 'Postal Code' })
  @Expose()
  postalCode!: string;

  @ApiProperty({ description: 'Is default' })
  @Expose()
  isDefault!: number;
}

export class AddressListResponseDto extends PaginatedResponseDto<AddressResponseDto> {
  @ApiProperty({ isArray: true, type: AddressResponseDto })
  override list!: AddressResponseDto[];
}
