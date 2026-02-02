import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SearchUserDto {
  @ApiProperty({
    description: 'Search keyword (Nickname, Phone, or UUID)',
    example: 'Alice',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Keyword cannot be empty' })
  @MinLength(1)
  keyword!: string;
}
