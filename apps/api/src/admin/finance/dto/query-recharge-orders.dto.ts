import { ApiProperty } from '@nestjs/swagger';

export class QueryRechargeOrdersDto {
  @ApiProperty({ description: 'Page Number', example: 1 })
  page!: number;

  @ApiProperty({
    description: 'Recharge Order Number',
    example: 10,
    required: false,
  })
  pageSize!: number;

  @ApiProperty({
    description: 'Recharge Order Number',
    example: 'recharge_12345',
    required: false,
  })
  rechargeNo?: string;

  @ApiProperty({ description: 'Order Status', example: 1, required: false })
  status?: number;

  @ApiProperty({
    description: 'Search Keyword: order number / user nickname / phone number',
    example: 'john_doe',
    required: false,
  })
  keyword?: string;

  @ApiProperty({
    description: 'Start Date (YYYY-MM-DD)',
    example: '2024-01-01',
    required: false,
  })
  startDate?: string;

  @ApiProperty({
    description: 'End Date (YYYY-MM-DD)',
    example: '2024-01-31',
    required: false,
  })
  endDate?: string;
}
