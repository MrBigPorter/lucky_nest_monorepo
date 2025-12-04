import { ApiProperty } from '@nestjs/swagger';

export class WalletDebitResponseDto {
  @ApiProperty({
    description: 'Updated Real Balance',
    example: '100.00',
    type: String,
  })
  realBalance!: string;
}
