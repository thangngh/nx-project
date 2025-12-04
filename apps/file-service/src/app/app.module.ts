import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MinioModule } from '@nx-project/minio';
import { FileController } from './file.controller.ts';
import { FileService } from './file.service.ts';
import { HealthController } from './health.controller.ts';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    MinioModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        endPoint: configService.get('MINIO_ENDPOINT', 'localhost'),
        port: configService.get('MINIO_PORT', 9000),
        useSSL: configService.get('MINIO_USE_SSL', 'false') === 'true',
        accessKey: configService.get('MINIO_ACCESS_KEY', 'admin'),
        secretKey: configService.get('MINIO_SECRET_KEY', '123456789'),
        region: configService.get('MINIO_REGION', 'us-east-1'),
        defaultBucket: configService.get('MINIO_DEFAULT_BUCKET', 'uploads'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FileController, HealthController],
  providers: [FileService],
})
export class AppModule { }
