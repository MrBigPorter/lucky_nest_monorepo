import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ToNumber } from '@api/common/dto/transforms';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GroupCreateDto {
  @ApiPropertyOptional({
    description: 'Treasure Id',
    example: '1',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  treasureId!: string;

  @ApiPropertyOptional({
    description: 'Leader User Id',
    example: '1',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  leaderUserId!: string;

  @ApiPropertyOptional({
    description: 'Group Name',
    example: 'Group Name',
    type: String,
  })
  @IsOptional()
  @IsString()
  groupName?: string;

  @ApiPropertyOptional({ description: 'maxMembers', example: 10, type: Number })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(2)
  @Max(99999)
  maxMembers?: number;

  @ApiPropertyOptional({ description: 'Order Id', example: '1', type: String })
  @IsOptional()
  @IsString()
  orderId!: string;
}
