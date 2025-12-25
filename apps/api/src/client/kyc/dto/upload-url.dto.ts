import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { UploadFolderDto } from '@api/common/upload/dto/upload-folder.dto';
import { Expose } from 'class-transformer';

export class UploadUrlDto {
  @ApiProperty({ description: 'File Name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Matches(/\.(jpg|jpeg|png|webp)$/i, {
    message: 'Invalid file type. Only jpg, jpeg, png, webp are allowed.',
  })
  fileName!: string;

  @ApiProperty({
    description: 'File Type',
    example: 'image/jpeg',
    enum: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp', 'image/jpg'], {
    message:
      'Invalid file type. Only image/jpeg, image/png, image/webp are allowed.',
  })
  fileType!: string;
}

@Expose()
export class UploadUrlResponseDto {
  @ApiProperty({
    description: 'Upload URL',
    example: 'https://example.com/upload',
  })
  url!: string;

  @ApiProperty({ description: 'File Key' })
  key!: string;

  @ApiPropertyOptional({
    description: 'CDN URL',
    example: 'https://cdn.example.com/uploads/2024/06/filename.jpg',
  })
  cdnUrl?: string;

  @ApiProperty({ description: 'Is Private File' })
  isPrivate!: boolean;
}
