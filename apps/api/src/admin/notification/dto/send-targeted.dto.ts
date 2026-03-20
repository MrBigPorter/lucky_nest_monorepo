import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
export class AdminSendTargetedDto {
  @IsNotEmpty()
  @IsString()
  targetUserId!: string;
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title!: string;
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  body!: string;
  @IsOptional()
  extraData?: Record<string, unknown>;
}
