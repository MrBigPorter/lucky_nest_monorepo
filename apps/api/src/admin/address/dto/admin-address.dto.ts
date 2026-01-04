import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  Matches,
  IsBoolean,
  Max,
} from 'class-validator';
import { Type, Exclude, Expose, Transform } from 'class-transformer';
import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';
import {
  DateToTimestamp,
  IsSmartPhone,
  ToInt,
} from '@api/common/dto/transforms';

export class AdminQueryAddressDto {
  @ApiProperty({ description: 'page number, default is 1' })
  @IsOptional()
  @ToInt()
  @IsInt()
  @Min(1)
  page!: number;

  @ApiProperty({ description: 'page size, max is 100' })
  @IsOptional()
  @ToInt()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize!: number;

  @ApiPropertyOptional({ description: 'user id' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'province' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({
    description: 'keyword (search in firstName, lastName, phone)',
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class AdminUpdateAddressDto {
  @ApiPropertyOptional({ description: 'lastName' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ description: 'firstName' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({ description: 'contactName' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  contactName!: string;

  @ApiPropertyOptional({ description: 'phone' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @IsSmartPhone()
  phone?: string;

  @ApiProperty({ description: 'provinceId' })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  provinceId!: number;

  @ApiProperty({ description: 'cityId' })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  cityId!: number;

  @ApiProperty({ description: 'barangayId' })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  barangayId!: number;

  @ApiPropertyOptional({ description: 'fullAddress' })
  @IsOptional()
  @IsString()
  fullAddress?: string;

  @ApiPropertyOptional({ description: 'isDefault (0/1)' })
  @IsOptional()
  @ToInt()
  @IsInt()
  @Min(0)
  @Max(1)
  isDefault?: number;
}

@Exclude()
export class AdminAddressResponseDto {
  @ApiProperty()
  @Expose()
  addressId!: string;

  @ApiProperty()
  @Expose()
  userId!: string;

  @ApiPropertyOptional()
  @Expose()
  userNickname?: string;

  @ApiProperty()
  @Expose()
  firstName!: string;

  @ApiProperty()
  @Expose()
  lastName!: string;

  @ApiProperty()
  @Expose()
  contactName!: string;

  @ApiProperty()
  @Expose()
  phone!: string;

  @ApiProperty()
  @Expose()
  province!: string;

  @ApiProperty()
  @Expose()
  city!: string;

  @ApiProperty()
  @Expose()
  barangay!: string;

  @ApiProperty()
  @Expose()
  fullAddress!: string;

  @ApiProperty()
  @Expose()
  postalCode!: string;

  @ApiProperty()
  @Expose()
  isDefault!: number;

  @ApiProperty()
  @Expose()
  @DateToTimestamp()
  createdAt!: number;
}

export class AdminAddressListResponseDto extends PaginatedResponseDto<AdminAddressResponseDto> {
  @ApiProperty({ type: [AdminAddressResponseDto] })
  override list!: AdminAddressResponseDto[];
}
