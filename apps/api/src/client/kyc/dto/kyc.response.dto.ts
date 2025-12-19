import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class KycResponseDto {
  @ApiProperty({
    description:
      'KYC status: DRAFT: 0, REVIEWING: 1, REJECTED: 2, NEED_MORE: 3, APPROVED: 4',
  })
  @Expose()
  kycStatus!: number;
}
