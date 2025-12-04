import { Injectable, Logger } from '@nestjs/common';
import { MinioService, UploadResult, ObjectInfo } from '@nx-project/minio';
import * as sharp from 'sharp';

interface UploadOptions {
  bucket?: string;
  filename?: string;
}

interface ThumbnailResult {
  buffer: Buffer;
  contentType: string;
  size: number;
}

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(private readonly minioService: MinioService) { }

  async upload(file: Express.Multer.File, options: UploadOptions = {}): Promise<UploadResult> {
    this.logger.log(`Uploading file: ${file.originalname} (${file.size} bytes)`);

    return this.minioService.upload(file.buffer, file.size, {
      bucket: options.bucket,
      objectName: options.filename || file.originalname,
      contentType: file.mimetype,
    });
  }

  async download(bucket: string, objectName: string) {
    this.logger.log(`Downloading file: ${bucket}/${objectName}`);
    return this.minioService.download(bucket, objectName);
  }

  async delete(bucket: string, objectName: string): Promise<void> {
    this.logger.log(`Deleting file: ${bucket}/${objectName}`);
    return this.minioService.delete(bucket, objectName);
  }

  async getInfo(bucket: string, objectName: string): Promise<ObjectInfo> {
    return this.minioService.getObjectInfo(bucket, objectName);
  }

  async getPresignedUrl(bucket: string, objectName: string, expirySeconds: number): Promise<string> {
    return this.minioService.getPresignedDownloadUrl({
      bucket,
      objectName,
      expirySeconds,
    });
  }

  async listBuckets(): Promise<string[]> {
    return this.minioService.listBuckets();
  }

  async listObjects(bucket: string, prefix?: string): Promise<ObjectInfo[]> {
    return this.minioService.listObjects({
      bucket,
      prefix,
      recursive: true,
    });
  }

  async getThumbnail(bucket: string, objectName: string, maxSize = 200): Promise<ThumbnailResult> {
    this.logger.log(`Generating thumbnail: ${bucket}/${objectName}`);

    const { stream } = await this.minioService.download(bucket, objectName);
    const chunks: Buffer[] = [];

    // Collect stream data
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    const buffer = Buffer.concat(chunks);

    // Generate thumbnail using sharp
    const thumbnail = await sharp(buffer)
      .resize(maxSize, maxSize, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    return {
      buffer: thumbnail,
      contentType: 'image/jpeg',
      size: thumbnail.length,
    };
  }
}
