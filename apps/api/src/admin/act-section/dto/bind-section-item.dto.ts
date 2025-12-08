import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class BindSectionItemDto {
  @ApiProperty({ description: 'treasure ids', example: ['1', '2'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  treasureIds!: string[];
}
