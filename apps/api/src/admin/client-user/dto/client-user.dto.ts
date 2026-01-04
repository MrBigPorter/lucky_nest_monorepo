import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  DateToTimestamp,
  DecimalToString,
  ToInt,
} from '@api/common/dto/transforms';
import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';

// --- 1. 列表搜索参数 ---
export class QueryClientUserDto {
  @ApiProperty({ description: '页码', default: 1 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ description: '每页数量', default: 20 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  pageSize: number = 20;

  @ApiPropertyOptional({ description: '手机号 (模糊查询)' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '用户ID (精确查询)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'KYC状态: 0-未认证 1-审核中 4-已认证' })
  @IsOptional()
  @ToInt()
  @IsInt()
  kycStatus?: number;

  @ApiPropertyOptional({ description: '注册开始时间' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: '注册结束时间' })
  @IsOptional()
  @IsDateString()
  endTime?: string;
}

// --- 2. 修改用户状态 (封号/解冻) ---
export class UpdateUserStatusDto {
  @ApiProperty({ description: '状态: 1-正常 0-冻结/封禁' })
  @IsInt()
  @IsEnum([0, 1])
  status!: number; // 假设 User 表未来会加 status 字段，或者用 kycStatus 模拟

  @ApiPropertyOptional({ description: '封禁/操作备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

// --- 3. 设备拉黑操作 (关联之前的 DeviceBlacklist) ---
export class BanDeviceDto {
  @ApiProperty({ description: '设备硬件指纹 ID' })
  @IsString()
  deviceId!: string;

  @ApiProperty({ description: '拉黑原因' })
  @IsString()
  reason!: string;
}

// ==========================================
// 1. 基础组件 VO (钱包、设备、日志)
// ==========================================

@Exclude()
export class ClientUserWalletVo {
  @Expose()
  @ApiProperty({ description: '现金余额' })
  @DecimalToString()
  realBalance!: string;

  @Expose()
  @ApiProperty({ description: '金币余额' })
  @DecimalToString()
  coinBalance!: string;
}

@Exclude()
export class AdminUserLoginLogVo {
  @Expose()
  @ApiProperty({ description: '登录时间' })
  @DateToTimestamp()
  loginTime!: number;

  @Expose()
  @ApiProperty({ description: '登录IP' })
  loginIp!: string;

  @Expose()
  @ApiProperty({ description: '登录设备/UserAgent' })
  loginDevice!: string;
}

@Exclude()
export class ClientUserDeviceVo {
  @Expose()
  @ApiProperty({ description: '记录ID (操作解绑用)' })
  id!: string;

  @Expose()
  @ApiProperty({ description: '设备指纹 (操作拉黑用)' })
  deviceId!: string;

  @Expose()
  @ApiProperty({ description: '设备型号' })
  deviceModel!: string;

  @Expose()
  @ApiProperty({ description: '最后活跃时间' })
  @DateToTimestamp()
  lastActiveAt!: number;

  @Expose()
  @ApiProperty({ description: 'IP地址' })
  ipAddress!: string;

  //  核心风控字段：前端据此显示红/绿状态
  @Expose()
  @ApiProperty({ description: '是否被拉黑 (True=已拉黑)' })
  isBanned!: boolean;

  @Expose()
  @ApiProperty({ description: '拉黑原因', required: false })
  banReason?: string;
}

// ==========================================
// 2. 列表项 VO (AdminUserListItemVo)
// ==========================================

@Exclude()
export class ClientUserListItemVo {
  @Expose()
  @ApiProperty({ description: '用户ID' })
  id!: string;

  @Expose()
  @ApiProperty({ description: '昵称' })
  nickname!: string;

  @Expose()
  @ApiProperty({ description: '手机号' })
  phone!: string;

  @Expose()
  @ApiProperty({ description: '头像' })
  avatar!: string;

  @Expose()
  @ApiProperty({ description: 'VIP等级' })
  vipLevel!: number;

  @Expose()
  @ApiProperty({ description: 'KYC状态' })
  kycStatus!: number;

  @Expose()
  @ApiProperty({ description: '邀请码' })
  inviteCode!: string;

  @Expose()
  @ApiProperty({ description: '注册时间' })
  @DateToTimestamp()
  createdAt!: number;

  @Expose()
  @ApiProperty({ description: '最后登录时间' })
  @DateToTimestamp()
  lastLoginAt!: number;

  // 嵌套对象转换
  @Expose()
  @ApiProperty({ description: '钱包简要信息' })
  wallet!: ClientUserWalletVo;
}

@Exclude()
export class ClientUserDetailVo extends ClientUserListItemVo {
  @Expose()
  @ApiProperty({ description: '最近登录日志列表', type: [AdminUserLoginLogVo] })
  @Type(() => AdminUserLoginLogVo)
  loginLogs!: AdminUserLoginLogVo[];

  @Expose()
  @ApiProperty({ description: '最近使用设备列表', type: [ClientUserDeviceVo] })
  @Type(() => ClientUserDeviceVo)
  devices!: ClientUserDeviceVo[];
}

// ==========================================
// 4. 分页包装 VO
// ==========================================

export class ClientUserListResultVo extends PaginatedResponseDto<ClientUserListItemVo> {
  @ApiProperty({ type: [ClientUserListItemVo] })
  override list!: ClientUserListItemVo[];
}
