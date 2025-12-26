import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class KycIdCardOrcDto {
  @ApiProperty({ description: 'The key of the ID card OCR field' })
  @IsNotEmpty()
  @IsString()
  key!: string;
}
