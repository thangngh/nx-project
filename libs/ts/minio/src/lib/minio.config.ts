import { ModuleMetadata } from '@nestjs/common';

export interface MinioModuleOptions {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  region?: string;
  defaultBucket?: string;
}

export interface MinioModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<MinioModuleOptions> | MinioModuleOptions;
  inject?: any[];
}
