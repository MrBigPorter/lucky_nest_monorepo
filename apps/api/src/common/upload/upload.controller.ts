import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  Body,
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
import { UploadFolderDto } from '@api/common/upload/dto/upload-folder.dto';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: 'upload image/video (Cloudflare R2)' })
  @ApiConsumes('multipart/form-data')
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
    @Body() dto: UploadFolderDto,
  ) {
    // 根据 mime 类型区分存储目录
    const isVideo = file.mimetype.startsWith('video/');

    let target = dto.folder;
    if (!dto.folder) {
      target = isVideo ? 'videos' : 'images';
    }

    return this.uploadService.uploadFile(file, target);
  }
}
