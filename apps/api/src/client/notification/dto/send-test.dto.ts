import { IsString, IsNotEmpty } from 'class-validator';

export class SendTestDto {
  @IsString({ message: '用户ID必须是字符串' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  userId!: string;

  @IsString()
  @IsNotEmpty({ message: '标题不能为空' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: '内容不能为空' })
  body!: string; // 我把之前的 msg 改成了 body，为了和 FCM 的术语保持一致
}

export class SendBroadcastDto {
  @IsString()
  @IsNotEmpty({ message: '标题不能为空' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: '内容不能为空' })
  body!: string;
}
