import { ApiProperty } from '@nestjs/swagger';

export class UploadTokenResponseDto {
  @ApiProperty({
    description: 'S3 预签名上传地址 (PUT)',
    example: 'https://r2.cloudflarestorage.com/...',
  })
  url!: string;

  @ApiProperty({
    description: '文件存储 Key (用于发消息)',
    example: 'uploads/chat/user_1/uuid.jpg',
  })
  key!: string;

  @ApiProperty({
    description: 'CDN 访问地址 (仅公开桶返回)',
    required: false,
    example: 'https://cdn.myshop.com/...',
  })
  cdnUrl?: string;

  @ApiProperty({ description: '是否私有文件', example: false })
  isPrivate!: boolean;
}
