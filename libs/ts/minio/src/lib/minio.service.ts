import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import {
  UploadOptions,
  UploadResult,
  DownloadResult,
  ObjectInfo,
  PresignedUrlOptions,
  ListObjectsOptions,
} from './minio.types.ts';
import { MinioModuleOptions } from './minio.config.ts';

export const MINIO_OPTIONS = 'MINIO_OPTIONS';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private defaultBucket: string;

  constructor(
    @Inject(MINIO_OPTIONS) private readonly options: MinioModuleOptions,
  ) {
    this.client = new Minio.Client({
      endPoint: options.endPoint,
      port: options.port,
      useSSL: options.useSSL,
      accessKey: options.accessKey,
      secretKey: options.secretKey,
      region: options.region,
    });
    this.defaultBucket = options.defaultBucket || 'uploads';
  }

  async onModuleInit() {
    try {
      await this.ensureBucket(this.defaultBucket);
      this.logger.log(`MinIO connected successfully. Default bucket: ${this.defaultBucket}`);
    } catch (error) {
      this.logger.error('Failed to connect to MinIO', error);
      throw error;
    }
  }

  /**
   * Get the underlying MinIO client
   */
  getClient(): Minio.Client {
    return this.client;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.listBuckets();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensure a bucket exists
   */
  async ensureBucket(bucket: string): Promise<void> {
    const exists = await this.client.bucketExists(bucket);
    if (!exists) {
      await this.client.makeBucket(bucket, this.options.region || 'us-east-1');
      this.logger.log(`Bucket created: ${bucket}`);
    }
  }

  /**
   * Upload a file
   */
  async upload(
    buffer: Buffer | Readable,
    size: number,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    const bucket = options.bucket || this.defaultBucket;
    const objectName = options.objectName || uuidv4();
    const contentType = options.contentType || 'application/octet-stream';
    const metadata = options.metadata || {};

    await this.ensureBucket(bucket);

    const result = await this.client.putObject(
      bucket,
      objectName,
      buffer,
      size,
      {
        'Content-Type': contentType,
        ...metadata,
      },
    );

    return {
      bucket,
      objectName,
      etag: result.etag,
      size,
      contentType,
      url: `/${bucket}/${objectName}`,
      uploadedAt: new Date(),
    };
  }

  /**
   * Upload a file from a stream
   */
  async uploadStream(
    stream: Readable,
    size: number,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    return this.upload(stream as any, size, options);
  }

  /**
   * Download a file
   */
  async download(bucket: string, objectName: string): Promise<DownloadResult> {
    const stat = await this.client.statObject(bucket, objectName);
    const stream = await this.client.getObject(bucket, objectName);

    return {
      stream,
      size: stat.size,
      contentType: stat.metaData['content-type'] || 'application/octet-stream',
      etag: stat.etag,
      lastModified: stat.lastModified,
      metadata: stat.metaData,
    };
  }

  /**
   * Download to buffer
   */
  async downloadToBuffer(bucket: string, objectName: string): Promise<Buffer> {
    const { stream } = await this.download(bucket, objectName);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  /**
   * Get object info
   */
  async getObjectInfo(bucket: string, objectName: string): Promise<ObjectInfo> {
    const stat = await this.client.statObject(bucket, objectName);

    return {
      bucket,
      name: objectName,
      size: stat.size,
      etag: stat.etag,
      lastModified: stat.lastModified,
      contentType: stat.metaData['content-type'],
      metadata: stat.metaData,
    };
  }

  /**
   * Check if object exists
   */
  async objectExists(bucket: string, objectName: string): Promise<boolean> {
    try {
      await this.client.statObject(bucket, objectName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete an object
   */
  async delete(bucket: string, objectName: string): Promise<void> {
    await this.client.removeObject(bucket, objectName);
  }

  /**
   * Delete multiple objects
   */
  async deleteMany(bucket: string, objectNames: string[]): Promise<void> {
    await this.client.removeObjects(bucket, objectNames);
  }

  /**
   * List objects in a bucket
   */
  async listObjects(options: ListObjectsOptions): Promise<ObjectInfo[]> {
    const { bucket, prefix = '', recursive = true } = options;
    const objects: ObjectInfo[] = [];

    const stream = this.client.listObjects(bucket, prefix, recursive);

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        objects.push({
          bucket,
          name: obj.name || '',
          size: obj.size ?? 0,
          etag: obj.etag || '',
          lastModified: obj.lastModified ?? new Date(),
        });
      });
      stream.on('end', () => resolve(objects));
      stream.on('error', reject);
    });
  }

  /**
   * Generate presigned download URL
   */
  async getPresignedDownloadUrl(options: PresignedUrlOptions): Promise<string> {
    const { bucket, objectName, expirySeconds = 3600 } = options;
    return this.client.presignedGetObject(bucket, objectName, expirySeconds);
  }

  /**
   * Generate presigned upload URL
   */
  async getPresignedUploadUrl(options: PresignedUrlOptions): Promise<string> {
    const { bucket, objectName, expirySeconds = 3600 } = options;
    return this.client.presignedPutObject(bucket, objectName, expirySeconds);
  }

  /**
   * Copy object
   */
  async copy(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string,
  ): Promise<void> {
    const conds = new Minio.CopyConditions();
    await this.client.copyObject(
      destBucket,
      destObject,
      `/${sourceBucket}/${sourceObject}`,
      conds,
    );
  }

  /**
   * List buckets
   */
  async listBuckets(): Promise<string[]> {
    const buckets = await this.client.listBuckets();
    return buckets.map((b) => b.name);
  }

  /**
   * Delete bucket
   */
  async deleteBucket(bucket: string): Promise<void> {
    await this.client.removeBucket(bucket);
  }
}
