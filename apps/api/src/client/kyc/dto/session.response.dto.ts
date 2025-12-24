import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty()
  sessionId!: string;

  @ApiProperty({
    description: 'Whether the session is reused from recent unused one',
  })
  reused!: boolean;

  @ApiProperty({
    description: 'How many sessions user created today (including this one)',
  })
  todayUsedCount!: number;

  @ApiProperty({ description: 'Daily creation limit' })
  dailyLimit!: number;

  @ApiProperty({
    description: 'How many sessions remaining can be created today',
  })
  remaining!: number;
}
