import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTicketsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize?: number;

  /** 只返回未使用的票（true = 只返回 used=false）*/
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unusedOnly?: boolean;
}
