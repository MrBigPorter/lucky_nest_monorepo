import { ApiProperty } from '@nestjs/swagger';

export class ChatMemberDto {
  @ApiProperty({ description: '用户ID' })
  userId!: string;

  @ApiProperty({ description: '昵称' })
  nickname!: string;

  @ApiProperty({ description: '头像', required: false })
  avatar?: string;

  @ApiProperty({ description: '角色', enum: ['OWNER', 'ADMIN', 'MEMBER'] })
  role!: string;
}

export class ConversationDetailResponseDto {
  @ApiProperty({ description: '会话ID' })
  id!: string;

  @ApiProperty({ description: '显示名称 (群名或好友名)' })
  name!: string;

  // 1. 新增：会话头像
  @ApiProperty({
    description: '显示头像 (好友头像或群头像)',
    required: false,
    nullable: true,
  })
  avatar?: string | null;

  @ApiProperty({ description: '会话类型', enum: ['DIRECT', 'GROUP'] })
  type!: string;

  //  2. 新增：成员数量 (前端 Header 用到了 memberCount)
  @ApiProperty({ description: '成员数量' })
  memberCount!: number;

  @ApiProperty({ description: '成员列表', type: [ChatMemberDto] })
  members!: ChatMemberDto[];
}
