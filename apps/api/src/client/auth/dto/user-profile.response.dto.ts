import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { DateToTimestamp, MaskString } from '@api/common/dto/transforms';

@Exclude()
export class UserProfileResponseDto {
  @ApiProperty({ example: 'cmippru8j0000pic3giq0fgc4' })
  @Expose()
  id!: string;

  @ApiProperty({ example: '+639171234567' })
  @Expose()
  @MaskString('phone')
  phone!: string;

  @ApiProperty({ example: 'e10adc3949ba59abbe56e057f20f883e' })
  @Expose()
  phoneMd5!: string;

  @ApiProperty({ example: 'Porter' })
  @Expose()
  nickname!: string;

  @ApiPropertyOptional({
    example: 'https://cdn.xxx.com/avatar/1.png',
    nullable: true,
  })
  @Expose()
  avatar!: string | null;

  @ApiProperty({ example: 'ABCD12' })
  @Expose()
  inviteCode!: string;

  @ApiProperty({ example: 0, description: 'VIP level (0=normal)' })
  @Expose()
  vipLevel!: number;

  @ApiProperty({
    example: 1,
    description: 'KYC status (0=Pending,1=Review,2=Approved,3=Rejected)',
  })
  @Expose()
  kycStatus!: number;

  @ApiProperty({ description: 'Last login timestamp (ms)', nullable: true })
  @Expose()
  @DateToTimestamp()
  lastLoginAt!: number | null;

  @ApiProperty({
    example: '199009999',
    nullable: true,
    description: 'Self-exclusion expiry date',
  })
  @Expose()
  @DateToTimestamp()
  selfExclusionExpireAt!: Date | null;
}
