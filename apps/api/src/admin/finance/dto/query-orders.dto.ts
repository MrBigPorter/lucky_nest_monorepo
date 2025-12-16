import { ApiProperty } from '@nestjs/swagger';

export class QueryOrdersDto {
  @ApiProperty({ description: 'Page Number', example: 1 })
  page!: number;
  @ApiProperty({ description: 'Page Size', example: 10 })
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
