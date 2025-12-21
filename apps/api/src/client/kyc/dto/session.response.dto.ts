import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SessionResponseDto {
  @ApiProperty({ description: 'KYC session ID' })
  @Expose()
  sessionId!: string;
}
