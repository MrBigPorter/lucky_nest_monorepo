import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { KYC_ID_CARD_TYPE_VALUES } from './kyc-shared-enums';
import { DateToTimestamp } from '@api/common/dto/transforms';

export class KycIdCardOcrDto {
  @ApiProperty({ description: 'The storage key of the ID card image' })
  @IsNotEmpty()
  @IsString()
  key!: string;
}

export class KycOcrResponseDto {
  @ApiProperty({
    description: 'Detected ID card type (normalized text)',
    example: '0',
  })
  typeText!: string;

  @ApiProperty({
    description: 'Detected ID card type enum value (for DB mapping)',
    enum: KYC_ID_CARD_TYPE_VALUES,
    enumName: 'KycIdCardType',
    example: 'PASSPORT',
  })
  type!: string;

  @ApiProperty({
    description: 'Country code (e.g., PH, CN, VN, Global)',
    example: 'PH',
  })
  country!: string;

  @ApiProperty({ description: 'First name', nullable: true, required: false })
  firstName!: string | null;

  @ApiProperty({ description: 'Middle name', nullable: true, required: false })
  middleName!: string | null;

  @ApiProperty({ description: 'Last name', nullable: true, required: false })
  lastName!: string | null;

  @ApiProperty({
    description: 'Normalized full name in "FIRST MIDDLE LAST" order',
    nullable: true,
    required: false,
  })
  realName!: string | null;

  @ApiProperty({
    description: 'Extracted ID number (spaces/dashes removed)',
    nullable: true,
    required: false,
    example: 'A12345678',
  })
  idNumber!: string | null;

  @ApiProperty({
    description: 'Name as shown on the card (or fallback)',
    nullable: true,
    required: false,
    example: 'JUAN DELA CRUZ',
  })
  name!: string | null;

  @ApiProperty({
    description: 'Gender (MALE/FEMALE/UNKNOWN)',
    nullable: true,
    required: false,
    example: 'MALE',
  })
  gender!: string | null;

  @ApiProperty({
    description: 'Birthday (YYYY-MM-DD)',
    nullable: true,
    required: false,
    example: '1990-01-01',
  })
  @DateToTimestamp()
  birthday!: string | null;

  @ApiProperty({
    description: 'Expiry date (YYYY-MM-DD)',
    nullable: true,
    required: false,
    example: '2030-01-01',
  })
  @DateToTimestamp()
  expiryDate!: string | null;

  @ApiProperty({ description: 'Fraud/suspicious flag', example: false })
  isSuspicious!: boolean;

  @ApiProperty({ description: 'Fraud score (0-100)', example: 12 })
  fraudScore!: number;

  @ApiProperty({
    description: 'Fraud reason if suspicious',
    nullable: true,
    required: false,
    example: null,
  })
  fraudReason!: string | null;

  @ApiProperty({
    description: 'Raw text/debug source',
    example: 'Extracted by Gemini AI (2.5-flash) with Fraud Check',
  })
  rawText!: string;
}
