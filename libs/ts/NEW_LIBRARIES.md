# NX Monorepo - New Libraries Added

## 📦 Recently Added Libraries

I've added 10 new libraries to `libs/ts/`:

### 1. **Guard** (`@nx-project/guard`)
Authentication and authorization guards:
- `AuthGuard` - JWT/Bearer token authentication
- `RolesGuard` - Role-based access control
- `ThrottlerGuard` - Rate limiting protection

### 2. **Strategy** (`@nx-project/strategy`)
Passport authentication strategies:
- `JwtStrategy` - JWT authentication
- `LocalStrategy` - Username/password authentication
- **Dependencies**: `@nestjs/passport`, `passport`, `passport-jwt`, `passport-local`

### 3. **Validation** (`@nx-project/validation`)
Custom validators for class-validator:
- `@IsStrongPassword()` - Password strength validation
- `@IsPhoneNumber()` - E.164 phone format validation
- `@Match(property)` - Field matching validation
- **Dependencies**: `class-validator`

### 4. **Cache** (`@nx-project/cache`)
Caching service and decorators:
- `CacheService` - Cache management
- `@CacheKey(key)` - Method-level caching decorator
- **Dependencies**: `cache-manager`

### 5. **Queue** (`@nx-project/queue`)
Job queue management:
- `QueueService` - BullMQ queue management
- Create queues and workers
- **Dependencies**: `bullmq`

### 6. **Health** (`@nx-project/health`)
Health check indicators:
- `DatabaseHealthIndicator` - Database health checks
- `CustomHealthService` - Aggregated health checks
- **Dependencies**: `@nestjs/terminus`

### 7. **Utils** (`@nx-project/utils`)
Common utility functions:
- `StringUtils` - capitalize, camelCase, snakeCase, kebabCase, truncate
- `ArrayUtils` - unique, chunk, groupBy
- `DateUtils` - addDays, formatDate, isToday
- `ObjectUtils` - pick, omit, deepClone

### 8. **Testing** (`@nx-project/testing`)
Testing utilities and helpers:
- `TestHelpers` - createTestingModule, mockRepository, mockService
- `createMock<T>()` - Generic mock factory

### 9. **MinIO** (`@nx-project/minio`) ⭐ NEW
S3-compatible object storage client:
- `MinioModule` - NestJS module with forRoot/forRootAsync
- `MinioService` - Upload, download, presigned URLs
- **Dependencies**: `minio`

### 10. **RabbitMQ** (`@nx-project/rabbitmq`) ⭐ NEW
Message queue client for background jobs:
- `RabbitMQModule` - NestJS module
- `RabbitMQService` - Publish/consume messages
- `RabbitMQWorker` - Worker abstractions
- Queue constants and job types
- **Dependencies**: `amqplib`

## 🚀 Usage Examples

### Guards
```typescript
import { AuthGuard, RolesGuard } from '@nx-project/guard';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  @Get('admin')
  @UseGuards(new RolesGuard(['admin']))
  adminOnly() {}
}
```

### Validation
```typescript
import { IsStrongPassword, Match } from '@nx-project/validation';

export class CreateUserDto {
  @IsStrongPassword()
  password: string;

  @Match('password')
  confirmPassword: string;
}
```

### Utils
```typescript
import { StringUtils, ArrayUtils } from '@nx-project/utils';

const camel = StringUtils.camelCase('hello-world'); // 'helloWorld'
const unique = ArrayUtils.unique([1, 2, 2, 3]); // [1, 2, 3]
```

### Testing
```typescript
import { TestHelpers, createMock } from '@nx-project/testing';

const mockService = createMock(UserService);
const module = await TestHelpers.createTestingModule({
  providers: [{ provide: UserService, useValue: mockService }],
});
```

### MinIO
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
    }),
  ],
})
export class AppModule {}

// In service
async uploadFile(file: Express.Multer.File) {
  return this.minioService.upload(file.buffer, file.size, {
    objectName: file.originalname,
    contentType: file.mimetype,
  });
}
```

### RabbitMQ
```typescript
import { RabbitMQModule, RabbitMQService, Queues, JobTypes } from '@nx-project/rabbitmq';

@Module({
  imports: [
    RabbitMQModule.forRoot({
      url: 'amqp://admin:admin123@localhost:5672',
      prefetchCount: 5,
    }),
  ],
})
export class AppModule {}

// Publish a job
await rabbitMQService.publish(
  Queues.PDF_EXPORT,
  JobTypes.PDF_EXPORT_INVOICES,
  { userId: '123', invoiceIds: ['inv-1', 'inv-2'] }
);
```

## 📊 Complete Library List

Your monorepo now has **18 libraries** in `libs/ts/`:

1. ✅ config - Configuration management
2. ✅ decorator - Custom decorators
3. ✅ dto - Data Transfer Objects
4. ✅ docs - Swagger documentation
5. ✅ exception - Exception handling & filters
6. ✅ interceptor - HTTP interceptors
7. ✅ middleware - HTTP middleware
8. ✅ pipe - Validation pipes
9. ✅ **guard** - Authentication & authorization guards
10. ✅ **strategy** - Passport strategies
11. ✅ **validation** - Custom validators
12. ✅ **cache** - Caching service
13. ✅ **queue** - Job queue management
14. ✅ **health** - Health check indicators
15. ✅ **utils** - Common utilities
16. ✅ **testing** - Testing helpers
17. ✅ **minio** - MinIO/S3 object storage ⭐
18. ✅ **rabbitmq** - RabbitMQ message queue ⭐

Plus **1 shared library**:
- ✅ shared/ts/logger - Winston logger service

## 🔧 Next Steps

1. Run `yarn install` to install new dependencies
2. Configure each library's `package.json` to use TypeScript source (like logger)
3. Update `tsconfig.lib.json` files to allow `.ts` extensions
4. Add `.ts` extensions to all imports

See `QUICK_START.md` for usage instructions.

