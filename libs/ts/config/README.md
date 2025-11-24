# @nx-project/nest-config

This library provides a centralized configuration module for NestJS applications using `@nestjs/config`.

## Features

- **Type-safe configuration**: Uses `registerAs` for namespaced configurations.
- **Environment variable validation**: (Can be added with `joi` or `class-validator`).
- **Global access**: Configured as a global module.

## Available Configurations

### App Config (`app`)
- `port`: Application port (default: 3000) - `NEST_APP_PORT`

### Environment Config (`environment`)
- `local`: Boolean
- `development`: Boolean
- `staging`: Boolean
- `production`: Boolean
- Controlled by `NODE_ENV`

### JWT Config (`jwt`)
- `secret`: JWT secret key - `JWT_SECRET`
- `expiresIn`: Token expiration time - `JWT_EXPIRES_IN`
- `refreshSecret`: Refresh token secret - `JWT_REFRESH_SECRET`
- `refreshExpiresIn`: Refresh token expiration - `JWT_REFRESH_EXPIRES_IN`

### CORS Config (`cors`)
- `enabled`: Enable/disable CORS - `CORS_ENABLED`
- `origin`: Allowed origins - `CORS_ORIGIN`
- `methods`: Allowed HTTP methods - `CORS_METHODS`
- `credentials`: Allow credentials - `CORS_CREDENTIALS`

### Rate Limit Config (`rateLimit`)
- `ttl`: Time window in seconds - `RATE_LIMIT_TTL`
- `limit`: Max requests per window - `RATE_LIMIT_MAX`

### Logger Config (`logger`)
- `level`: Log level (debug, info, warn, error) - `LOG_LEVEL`
- `transport`: Log transport (console, file) - `LOG_TRANSPORT`

### Upload Config (`upload`)
- `maxFileSize`: Max file size in bytes - `UPLOAD_MAX_FILE_SIZE`
- `dest`: Upload destination directory - `UPLOAD_DEST`

## Usage

Import `NxProjectNestConfigModule` in your `AppModule`:

```typescript
import { Module } from '@nestjs/common';
import { NxProjectNestConfigModule } from '@nx-project/nest-config';

@Module({
  imports: [NxProjectNestConfigModule],
  // ...
})
export class AppModule {}
```

Inject `ConfigService` to use configurations:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHello(): string {
    const port = this.configService.get<number>('app.port');
    return `Hello from port ${port}`;
  }
}
```
