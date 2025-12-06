import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Injectable()
export class UploadService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicDomain: string;
  private readonly logger = new Logger(UploadService.name);

  constructor(private configService: ConfigService) {
    // initial
    const accountId = this.configService.getOrThrow<string>('CF_R2_ACCOUNT_ID');
    const accessKeyId = this.configService.getOrThrow<string>(
      'CF_R2_ACCESS_KEY_ID',
    );
    const secretAccessKey = this.configService.getOrThrow<string>(
      'CF_R2_SECRET_ACCESS_KEY',
    );
    this.bucketName =
      this.configService.getOrThrow<string>('CF_R2_BUCKET_NAME');
    this.publicDomain = this.configService.getOrThrow<string>(
      'CF_R2_PUBLIC_DOMAIN',
    );

    //connect to r2 Cloudflare
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  // upload file to R2
  async uploadFile(file: Express.Multer.File, folder: string = 'treasures') {
    // generate unique file name: treasures/uuid.jpg
    const fileExt = extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExt}`;

    try {
      // apply to upload
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer, // 直接上传内存中的 Buffer
          ContentType: file.mimetype,
        }),
      );

      // return url
      const domain = this.publicDomain.replace(/\/$/, '');
      const url = `${domain}/${fileName}`;

      this.logger.log(`File uploaded successfully: ${url}`);

      return {
        url,
        key: fileName,
        originalName: file.originalname,
      };
    } catch (error) {
      // @ts-ignore
      this.logger.error(`R2 Upload Error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('R2 Upload Error');
    }
  }
}
