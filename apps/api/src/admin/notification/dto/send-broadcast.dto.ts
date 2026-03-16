import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
export class AdminSendBroadcastDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title!: string;
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  body!: string;
  /** 附带的自定义 JSON 数据（可选） */
  @IsOptional()
  extraData?: Record<string, unknown>;
}
