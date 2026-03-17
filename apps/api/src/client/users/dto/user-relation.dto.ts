import { IsNotEmpty, IsString } from 'class-validator';

// 2. searchUsers DTO
export class UserInfoResponseDto {
  id!: string;
  nickname!: string | null;
  avatar!: string | null;
  phone?: string;
}

// 3. addFriend DTO
export class ClientAddFriendDto {
  @IsNotEmpty()
  @IsString()
  friendId!: string;
}
