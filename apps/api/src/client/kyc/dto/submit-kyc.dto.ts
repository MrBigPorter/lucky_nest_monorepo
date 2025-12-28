import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ToInt } from '@api/common/dto/transforms';

export class SubmitKycDto {
  /**
   *告诉 Swagger 这是一个文件上传字段
   * 类型不要写 string，校验器也不要加 @IsString (因为实际收到的是 File 对象，会被拦截器拿走)
   */
  @ApiProperty({
    description: 'ID Card Front Image (Binary File)',
    type: 'string',
    format: 'binary', // 让 Swagger 显示上传按钮
  })
  @IsOptional() // 必填校验移到 Controller 的 files.idCardFront 判断
  idCardFront: any;

  @ApiPropertyOptional({
    description: 'ID Card Back Image (Binary File)',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  idCardBack?: any;

  // === 2. 业务字段 ===

  @ApiProperty({
    description: 'AWS Liveness Session ID',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  sessionId!: string;

  /**
   * 对应数据库 KycIdType.id (1=Passport, 10=DriverLicense)
   */
  @ApiProperty({ description: 'ID Type ID (e.g. 1, 10)', example: 1 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  idType!: number;

  @ApiProperty({ description: 'ID Number', maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  idNumber!: string;

  @ApiProperty({ description: 'Real Name', maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  realName!: string;

  // === 3. 可选辅助字段 ===

  @ApiPropertyOptional({
    description: 'OCR raw data object (Optional correction)',
  })
  @IsOptional()
  @IsObject()
  ocrRawData?: Record<string, any>;
}
