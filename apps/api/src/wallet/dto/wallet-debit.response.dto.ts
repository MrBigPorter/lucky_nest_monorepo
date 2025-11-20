import {ApiProperty} from "@nestjs/swagger";

export class WalletDebitResponseDto {
   @ApiProperty({ description: 'Transaction Number', example: 'TXN1234567890', type: String})
   transactionNo!: string;
    @ApiProperty({ description: 'Updated Real Balance', example: '100.00', type: String})
   realBalance!: string;
}