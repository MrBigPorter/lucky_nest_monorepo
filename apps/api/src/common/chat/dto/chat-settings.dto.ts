import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetMuteDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({ description: 'Mute status (true to mute)' })
  @IsBoolean()
  @IsNotEmpty()
  isMuted!: boolean;
}

export class SetPinDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({ description: 'Pin status (true to pin)' })
  @IsBoolean()
  @IsNotEmpty()
  isPinned!: boolean;
}

export class ClearHistoryDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;
}

export class SetMuteResponseDto {
  @ApiProperty({ description: 'Operation success status', example: true })
  success!: boolean;

  @ApiProperty({ description: 'Latest mute status', example: true })
  isMuted!: boolean;
}

export class SetPinResponseDto {
  @ApiProperty({ description: 'Operation success status', example: true })
  success!: boolean;

  @ApiProperty({ description: 'Latest pin status', example: true })
  isPinned!: boolean;
}

export class ClearHistoryResponseDto {
  @ApiProperty({ description: 'Operation success status', example: true })
  success!: boolean;
}
