import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class BarangaysResponseDto {
  @ApiProperty({ description: 'barangay ID' })
  @Expose()
  barangayId!: number;

  @ApiProperty({ description: 'barangay Name' })
  @Expose()
  barangayName!: string;
}
