import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryOperationLogDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  adminId?: string;

  /** 操作类型，对应 AdminOperationLog.action，e.g. "LOGIN" / "CREATE" */
  @IsOptional()
  @IsString()
  action?: string;

  /** 关键词搜索（匹配 adminName / details / module） */
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
