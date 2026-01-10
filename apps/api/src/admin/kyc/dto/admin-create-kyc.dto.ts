import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class AdminCreateKycDto {
  @ApiProperty({ description: '目标用户的 UserID', example: 'cmk...' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsString()
  userId!: string;

  @ApiProperty({ description: '真实姓名', example: '张三' })
  @IsNotEmpty({ message: '真实姓名不能为空' })
  @IsString()
  realName!: string;

  @ApiProperty({ description: '证件号码', example: '110101199001011234' })
  @IsNotEmpty({ message: '证件号码不能为空' })
  @IsString()
  idNumber!: string;

  @ApiProperty({
    description: '证件类型: 1=身份证, 2=护照 (默认为1)',
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  idType?: number = 1;

  // --- 以下图片字段对管理员来说是选填的 ---
  // 因为管理员可能是线下审核，手头没有图片，只有文字资料

  @ApiProperty({ description: '正面照URL (选填)', required: false })
  @IsOptional()
  @IsString()
  idCardFront?: string;

  @ApiProperty({ description: '反面照URL (选填)', required: false })
  @IsOptional()
  @IsString()
  idCardBack?: string;

  @ApiProperty({ description: '手持/人脸照URL (选填)', required: false })
  @IsOptional()
  @IsString()
  faceImage?: string;

  @ApiProperty({ description: '备注/审核意见', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}

// PartialType 会自动把 AdminCreateKycDto 里的所有字段变成 @IsOptional()
// 这样管理员修改时，想改哪个字段就传哪个，不用全传
export class AdminUpdateKycDto extends PartialType(AdminCreateKycDto) {}
