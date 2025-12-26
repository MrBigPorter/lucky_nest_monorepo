import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { KycIdCardType } from '@lucky/shared';

export class KycIdCardOrcDto {
  @ApiProperty({ description: 'The key of the ID card OCR field' })
  @IsNotEmpty()
  @IsString()
  key!: string;
}

export class KycOcrResponseDto {
  @ApiProperty({
    description: 'Detected ID card type',
    enum: KycIdCardType,
    example: 'PASSPORT',
  })
  type!: string;

  @ApiProperty({
    description: 'Country code (e.g., PH, CN, VN, Global)',
    example: 'PH',
  })
  country!: string;

  @ApiProperty({
    description: 'Extracted ID number',
    required: false,
    nullable: true,
    example: 'A12345678',
  })
  idNumber!: string | null;

  @ApiProperty({
    description: 'Extracted Name',
    required: false,
    nullable: true,
    example: 'JUAN DELA CRUZ',
  })
  name!: string | null;

  @ApiProperty({
    description:
      'Full raw text returned by OCR for debugging or manual correction',
  })
  rawText!: string;
}
