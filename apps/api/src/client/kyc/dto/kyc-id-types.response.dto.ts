import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class KycIdTypesResponseDto {
  @ApiProperty({ description: 'ID type ID', example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ description: 'Unique code', example: 'PASSPORT' })
  @Expose()
  code!: string;

  @ApiProperty({ description: 'Display name', example: 'Passport' })
  @Expose({ name: 'label' })
  typeName!: string;

  @ApiProperty({
    description: 'Whether front image is required',
    example: true,
  })
  @Expose()
  requiresFront!: boolean;

  @ApiProperty({
    description: 'Whether back image is required',
    example: false,
  })
  @Expose()
  requiresBack!: boolean;

  @ApiProperty({ description: 'Whether OCR is required', example: true })
  @Expose()
  requiresOcr!: boolean;
}
