# @nx-project/minio

MinIO client library for NestJS applications.

## Installation

This library is part of the Nx workspace and is automatically available.

## Usage

```typescript
import { MinioModule, MinioService } from '@nx-project/minio';

@Module({
  imports: [
    MinioModule.forRoot({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'admin',
      secretKey: '123456789',
      defaultBucket: 'uploads',
    }),
  ],
})
export class AppModule {}
```

## Features

- Upload/Download files
- Presigned URLs
- Bucket management
- Object listing
- Health checks
