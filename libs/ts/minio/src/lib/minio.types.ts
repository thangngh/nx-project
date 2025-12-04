import { Readable } from 'stream';

export interface UploadOptions {
  bucket?: string;
  objectName?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  bucket: string;
  objectName: string;
  etag: string;
  size: number;
  contentType: string;
  url: string;
  uploadedAt: Date;
}

export interface DownloadResult {
  stream: Readable;
  size: number;
  contentType: string;
  etag: string;
  lastModified: Date;
  metadata: Record<string, string>;
}

export interface ObjectInfo {
  bucket: string;
  name: string;
  size: number;
  etag: string;
  lastModified: Date;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface PresignedUrlOptions {
  bucket: string;
  objectName: string;
  expirySeconds?: number;
}

export interface ListObjectsOptions {
  bucket: string;
  prefix?: string;
  recursive?: boolean;
  maxKeys?: number;
}
