import { ApiProperty } from '@nestjs/swagger';

export class FriendRequestItemDto {
  @ApiProperty({ description: 'Requester User ID', example: 'user-123' })
  id!: string;

  @ApiProperty({ description: 'Requester Nickname', example: 'Alice' })
  nickname!: string;

  @ApiProperty({
    description: 'Requester Avatar URL',
    required: false,
    example: 'https://...',
  })
  avatar?: string;

  @ApiProperty({
    description: 'Request Timestamp (ms)',
    example: 1678888888000,
  })
  requestTime!: number;

  @ApiProperty({
    description: 'Verification message',
    required: false,
    example: 'Hello',
  })
  reason?: string;
}

export class ContactItemDto {
  @ApiProperty({ description: 'Friend User ID', example: 'user-456' })
  id!: string;

  @ApiProperty({
    description: 'Display Name (Remark or Nickname)',
    example: 'Bob',
  })
  nickname!: string;

  @ApiProperty({
    description: 'Avatar URL',
    required: false,
    example: 'https://...',
  })
  avatar?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  phone?: string;
}

export class HandleContactResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({
    description: 'Action taken',
    example: 'accepted',
    enum: ['accepted', 'rejected'],
  })
  action!: string;
}

export class AddFriendResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;
}

export class SearchUserResponseDto {
  @ApiProperty({ description: 'User ID', example: 'uuid-123' })
  id!: string;

  @ApiProperty({ description: 'User Nickname', example: 'Alice' })
  nickname!: string;

  @ApiProperty({
    description: 'User Avatar',
    required: false,
    example: 'https://...',
  })
  avatar?: string;

  @ApiProperty({
    description: 'Relationship status: 0=Stranger, 1=Friend, 2=RequestSent',
    example: 0,
  })
  status!: number;
}
