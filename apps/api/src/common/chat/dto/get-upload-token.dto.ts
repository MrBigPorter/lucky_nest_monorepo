import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetUploadTokenDto {
  @ApiProperty({ example: 'cat.jpg', description: 'File name' })
  @IsString({ message: 'fileName must be a string' })
  @IsNotEmpty({ message: 'fileName should not be empty' })
  fileName!: string;

  @ApiProperty({ example: 'image/jpeg', description: 'MIME type of the file' })
  @IsString()
  @IsNotEmpty()
  //  Update: Added 'audio' to support voice messages
  @Matches(/^(image|video|audio|application)\//, {
    message: 'Unsupported file type',
  })
  fileType!: string;
}
