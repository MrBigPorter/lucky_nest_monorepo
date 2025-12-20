import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import path from 'node:path';

@Injectable()
export class UploadService {
  private readonly s3Client: S3Client;
  private readonly publicBucket: string;
  private readonly privateBucket: string;
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
    this.publicBucket = this.configService.getOrThrow<string>(
      'R2_BUCKET_PUBLIC',
      'mini-shop',
    );
    this.privateBucket = this.configService.getOrThrow<string>(
      'R2_BUCKET_PRIVATE',
      'mini-kyc-private',
    );
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

  /**
   * Get bucket configuration based on module
   * @param module
   * @private
   */
  private getBucketConfig(module: string) {
    //define private modules
    const privateModules = ['kyc', 'finance', 'contract', 'id-card'];

    if (privateModules.includes(module)) {
      return {
        bucket: this.privateBucket,
        isPrivate: true,
      };
    }
    return {
      bucket: this.publicBucket,
      isPrivate: false,
    };
  }

  /**
   *  生成上传签名 URL (PUT)
   * 前端使用此 URL 上传文件
   */
  async generatePresignedUrl(
    userId: string,
    fileName: string,
    fileType: string,
    module: string = 'common',
  ) {
    const { bucket, isPrivate } = this.getBucketConfig(module);

    const fileExt = path.extname(fileName);
    const uniqueFileName = `${uuidv4()}${fileExt}`;
    // Key 格式: uploads/kyc/user_123/xxx.jpg
    const key = `uploads/${module}/${userId}/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
    });

    try {
      // 签发 10 分钟有效的上传链接
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: 600,
      });

      this.logger.log(`Generated upload URL for ${module} in bucket ${bucket}`);

      return {
        url, // 临时上传链接 (给前端 PUT 用)
        key, // 存数据库的 Key
        // 如果是公开桶，直接返回 CDN 链接；私有桶则不返回，强迫前端以后通过签名访问
        cdnUrl: isPrivate ? null : `${this.publicDomain}/${key}`,
        isPrivate,
      };
    } catch (error) {
      this.logger.error('Failed to generate presigned URL', error);
      throw new Error('Could not generate upload URL');
    }
  }

  /**
   * 生成查看/下载签名 URL (GET)
   */
  async getDownloadUrl(key: string, module: string = 'common') {
    if (!key) return null;
    // 兼容旧数据
    if (key.startsWith('http')) return key;

    const { bucket, isPrivate } = this.getBucketConfig(module);

    // 如果是公开桶，直接返回 CDN 链接，不浪费计算资源
    if (!isPrivate && this.publicDomain) {
      // 去掉末尾可能存在的 / 防止双斜杠
      const domain = this.publicDomain.replace(/\/$/, '');
      return `${domain}/${key}`;
    }

    // 私有桶：必须生成临时签名
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    try {
      // 签发 1 小时 (3600秒) 有效的查看链接
      return await getSignedUrl(this.s3Client as any, command, {
        expiresIn: 3600,
      });
    } catch (error) {
      this.logger.error(
        `Failed to generate download URL for key: ${key}`,
        error,
      );
      return null;
    }
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
          Bucket: this.publicBucket,
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
