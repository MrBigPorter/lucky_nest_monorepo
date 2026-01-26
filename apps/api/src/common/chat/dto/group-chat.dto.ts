import { IsArray, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { DateToTimestamp } from '@api/common/dto/transforms';
import { Exclude, Expose } from 'class-transformer';

// 1. create group chat DTO
export class CreateGroupDto {
  @IsNotEmpty({ message: 'Group name cannot be empty' })
  @IsString()
  @MinLength(2, { message: 'Group name is too short' })
  name!: string;

  @IsArray()
  @IsNotEmpty({ message: 'Please select at least one member' })
  @IsString({ each: true })
  memberIds!: string[]; // not include ownerId
}

// 2. create group chat response DTO
@Exclude()
export class GroupCreatedResponseDto {
  @Expose()
  id!: string; // conversation ID
  @Expose()
  name!: string; // group name
  @Expose()
  type!: string; // "GROUP"
  @Expose()
  ownerId!: string; // owner user ID
  @DateToTimestamp()
  createdAt!: number; // timestamp
}
