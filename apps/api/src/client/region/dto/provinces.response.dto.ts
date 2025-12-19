import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class ProvincesResponseDto {
  @ApiProperty({ description: 'Province ID' })
  @Expose()
  provinceId!: number;

  @ApiProperty({ description: 'Province Name' })
  @Expose()
  provinceName!: string;
}
