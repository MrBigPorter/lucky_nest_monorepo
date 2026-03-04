import { ApiProperty } from '@nestjs/swagger';

export class CouponActionResponseDto {
  @ApiProperty({ description: '操作是否成功', example: true })
  success!: boolean;

  @ApiProperty({
    description: '后端提示信息',
    example: 'Successfully redeemed',
  })
  message!: string;
}
