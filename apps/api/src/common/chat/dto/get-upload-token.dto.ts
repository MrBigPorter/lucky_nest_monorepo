import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // 如果你用 Swagger 文档

export class GetUploadTokenDto {
  @ApiProperty({ example: 'cat.jpg', description: '文件名' }) // 用于生成 Swagger 文档
  @IsString({ message: 'fileName 必须是字符串' }) // 校验类型
  @IsNotEmpty({ message: 'fileName 不能为空' }) // 校验非空
  fileName!: string;

  @ApiProperty({ example: 'image/jpeg', description: '文件的 MIME 类型' })
  @IsString()
  @IsNotEmpty()
  // 可选：加一个正则校验，防止有人传奇怪的类型
  @Matches(/^(image|video|application)\//, { message: '不支持的文件类型' })
  fileType!: string;
}
