import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, IsInt } from 'class-validator';

export class HandleContactDto {
  @ApiProperty({ description: 'The User ID who sent the request (Applicant)' })
  @IsString()
  @IsNotEmpty()
  targetId!: string;

  @ApiProperty({ description: 'True = Accept, False = Reject' })
  @IsInt()
  accept!: number;
}
