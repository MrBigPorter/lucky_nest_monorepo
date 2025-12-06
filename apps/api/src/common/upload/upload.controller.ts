import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { UploadService } from '@api/common/upload/upload.service';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: 'upload image/video (Cloudflare R2)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif|webp|mp4|avi|mov|mkv|webm)$/i,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // 根据 mime 类型区分存储目录
    const isVideo = file.mimetype.startsWith('video/');
    const folder = isVideo ? 'videos' : 'images';

    return this.uploadService.uploadFile(file, folder);
  }
}
