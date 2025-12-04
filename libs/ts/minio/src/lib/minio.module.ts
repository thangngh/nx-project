import { Module, DynamicModule, Global } from '@nestjs/common';
import { MinioService, MINIO_OPTIONS } from './minio.service.ts';
import { MinioModuleOptions, MinioModuleAsyncOptions } from './minio.config.ts';

@Global()
@Module({})
export class MinioModule {
  static forRoot(options: MinioModuleOptions): DynamicModule {
    return {
      module: MinioModule,
      providers: [
        {
          provide: MINIO_OPTIONS,
          useValue: options,
        },
        MinioService,
      ],
      exports: [MinioService],
    };
  }

  static forRootAsync(options: MinioModuleAsyncOptions): DynamicModule {
    return {
      module: MinioModule,
      imports: options.imports || [],
      providers: [
        {
          provide: MINIO_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        MinioService,
      ],
      exports: [MinioService],
    };
  }
}
