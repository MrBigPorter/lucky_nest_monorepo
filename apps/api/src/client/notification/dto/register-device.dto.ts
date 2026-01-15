import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class RegisterDeviceDto {
  @IsString({ message: 'Token必须是字符串' })
  @IsNotEmpty({ message: 'Token不能为空' })
  token!: string;

  @IsString()
  @IsNotEmpty()
  //  进阶：限制只能传这几个值，防止前端乱传 'huawei', 'xiaomi' 等奇怪字符
  @IsIn(['android', 'ios', 'web'], { message: '平台类型错误' })
  platform!: string;
}
