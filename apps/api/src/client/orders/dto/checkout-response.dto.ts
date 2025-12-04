import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutResponseDto {
  @ApiProperty({ description: 'Order Id', example: '1', type: String })
  orderId!: string;
  @ApiProperty({
    description: 'Order Number',
    example: 'ORD123456789',
    type: String,
  })
  orderNo!: string;
  @ApiPropertyOptional({
    description: 'Group ID if applicable',
    example: 'groupId123',
    type: String,
    required: false,
  })
  groupId?: string;
  @ApiProperty({
    description: 'List of lottery ticket numbers purchased',
    example: ['LT123456', 'LT123457'],
    type: [String],
  })
  lotteryTickets!: string[];
  @ApiProperty({
    description: 'Amount of activity coins used',
    example: 0,
    type: Number,
  })
  activityCoin!: number;
  @ApiProperty({
    description: 'Indicates if the user was already in the group purchase',
    example: false,
    type: Boolean,
  })
  alreadyInGroup!: boolean;
  @ApiProperty({
    description: 'Indicates if the user is the group owner',
    example: false,
    type: Boolean,
  })
  isGroupOwner!: number;
}
