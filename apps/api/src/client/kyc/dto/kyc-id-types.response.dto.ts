import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class KycIdTypesResponseDto {
  @ApiProperty({ description: 'ID type ID', example: 1 })
  @Expose()
  typeId!: number;

  @ApiProperty({ description: 'ID type name', example: 'Passport' })
  @Expose()
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
