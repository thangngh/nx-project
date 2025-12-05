# Winston Logger - Usage Examples

## 🎯 NestJS Server Usage

### 1. Setup in main.ts

```typescript
// apps/your-api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonLoggerService } from '@nx-project/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Winston logger
  const logger = app.get(WinstonLoggerService);
  app.useLogger(logger);

  await app.listen(3000);
  logger.log('Application started on port 3000', 'Bootstrap');
}

bootstrap();
```

### 2. Import Module

```typescript
// apps/your-api/src/app.module.ts
import { Module } from '@nestjs/common';
import { WinstonLoggerModule } from '@nx-project/logger';

@Module({
  imports: [
    WinstonLoggerModule, // ← Add this
    // ... other modules
  ],
})
export class AppModule {}
```

### 3. Use in Services

```typescript
// apps/your-api/src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { WinstonLoggerService } from '@nx-project/logger';

@Injectable()
export class UserService {
  constructor(private readonly logger: WinstonLoggerService) {
    this.logger.setContext(UserService.name);
  }

  async createUser(email: string, name: string) {
    // Simple log
    this.logger.log('Creating user');

    // Log with metadata
    this.logger.log('Creating user', { email, name });

    try {
      const user = await this.userRepo.save({ email, name });
      
      this.logger.log('User created successfully', {
        userId: user.id,
        email,
      });
      
      return user;
    } catch (error) {
      // Error logging with stack trace
      this.logger.error(
        'Failed to create user',
        error.stack,
        { email, error: error.message }
      );
      throw error;
    }
  }

  async getAllUsers() {
    this.logger.debug('Fetching all users');
    return this.userRepo.find();
  }
}
```

### 4. Use in Controllers

```typescript
// apps/your-api/src/user/user.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { WinstonLoggerService } from '@nx-project/logger';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(UserController.name);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.http('POST /users', {
      email: createUserDto.email,
    });
    
    return this.userService.createUser(
      createUserDto.email,
      createUserDto.name
    );
  }

  @Get()
  async findAll() {
    this.logger.http('GET /users');
    return this.userService.getAllUsers();
  }
}
```

### 5. HTTP Logging Middleware

```typescript
// apps/your-api/src/middleware/http-logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WinstonLoggerService } from '@nx-project/logger';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: WinstonLoggerService) {
    this.logger.setContext('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      this.logger.http(`${req.method} ${req.url}`, {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });
    });

    next();
  }
}

// Apply in app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
```

---

## 🌐 NextJS Client Usage

### 1. Create Logger Hook

```typescript
// apps/your-nextjs-app/src/hooks/useLogger.ts
import { useMemo } from 'react';
import { createNextJSLogger } from '@nx-project/logger';

export function useLogger(context?: string) {
  return useMemo(() => createNextJSLogger(context), [context]);
}
```

### 2. Use in Components

```typescript
// apps/your-nextjs-app/src/app/page.tsx
'use client';

import { useLogger } from '@/hooks/useLogger';
import { useEffect } from 'react';

export default function HomePage() {
  const logger = useLogger('HomePage');

  useEffect(() => {
    // Log page view
    logger.pageView('/');

    // Log component mount
    logger.debug('HomePage mounted');
  }, [logger]);

  const handleClick = () => {
    // Log user action
    logger.userAction('button_click', {
      buttonId: 'submit-button',
    });
  };

  return (
    <div>
      <h1>Home Page</h1>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}
```

### 3. API Call Logging

```typescript
// apps/your-nextjs-app/src/lib/api-client.ts
import { nextLogger } from '@nx-project/logger';

export async function apiCall(url: string, options?: RequestInit) {
  const startTime = performance.now();
  const method = options?.method || 'GET';

  try {
    const response = await fetch(url, options);
    const duration = performance.now() - startTime;

    // Log API call
    nextLogger.apiCall(method, url, response.status, duration);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    const duration = performance.now() - startTime;
    
    // Log API error
    nextLogger.error('API call failed', error as Error, {
      method,
      url,
      duration,
    });
    
    throw error;
  }
}
```

### 4. Error Boundary Logging

```typescript
// apps/your-nextjs-app/src/components/ErrorBoundary.tsx
'use client';

import React from 'react';
import { nextLogger } from '@nx-project/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Winston
    nextLogger.error('React Error Boundary caught error', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

### 5. Performance Monitoring

```typescript
// apps/your-nextjs-app/src/app/layout.tsx
'use client';

import { useEffect } from 'react';
import { nextLogger } from '@nx-project/logger';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Log Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            
            nextLogger.performance('page-load', navEntry.loadEventEnd, {
              domContentLoaded: navEntry.domContentLoadedEventEnd,
              domInteractive: navEntry.domInteractive,
            });
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });

      return () => observer.disconnect();
    }
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

---

## 📁 Log Files Output

Winston creates the following log files (server-side only):

```
logs/
├── combined-2025-12-05.log      # All logs
├── error-2025-12-05.log         # Error logs only
├── http-2025-12-05.log          # HTTP logs only
├── exceptions-2025-12-05.log    # Uncaught exceptions
└── rejections-2025-12-05.log    # Unhandled rejections
```

**Rotation:**
- Daily rotation (new file each day)
- Max size: 20MB per file
- Retention: 7-30 days depending on log type

---

## 🎨 Log Output Format

### Development (Console):
```
2025-12-05 09:30:45 [info] [UserService] User created successfully
{
  "userId": "123",
  "email": "user@example.com"
}
```

### Production (JSON):
```json
{
  "timestamp": "2025-12-05T09:30:45.123Z",
  "level": "info",
  "message": "User created successfully",
  "context": "UserService",
  "metadata": {
    "userId": "123",
    "email": "user@example.com"
  }
}
```

---

## 🔧 Configuration

### Environment Variables

```env
# .env
NODE_ENV=production          # development | production
LOG_LEVEL=info              # error | warn | info | http | debug
```

### Custom Configuration

```typescript
// Modify winston-logger.config.ts
const transports: winston.transport[] = [];

// Add custom transport (e.g., Elasticsearch)
if (process.env.ELASTICSEARCH_URL) {
  transports.push(
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: { node: process.env.ELASTICSEARCH_URL },
    })
  );
}
```

---

## 📊 Integration with Loki

Winston logs can be sent to Loki via Promtail:

```yaml
# .docker/promtail-config.yaml
scrape_configs:
  - job_name: nestjs-winston
    static_configs:
      - targets:
          - localhost
        labels:
          job: nestjs
          __path__: /path/to/logs/combined-*.log
```

---

## ✅ Best Practices

1. **Always set context**
   ```typescript
   this.logger.setContext(MyService.name);
   ```

2. **Use appropriate log levels**
   - `error`: Errors that need attention
   - `warn`: Warnings
   - `info`: Important business events
   - `http`: HTTP requests
   - `debug`: Debugging information

3. **Include metadata**
   ```typescript
   logger.log('Event occurred', { userId, action, timestamp });
   ```

4. **Don't log sensitive data**
   ```typescript
   // ❌ BAD
   logger.log('User login', { email, password });
   
   // ✅ GOOD
   logger.log('User login', { email });
   ```

5. **Use trace context for distributed tracing**
   ```typescript
   WinstonLoggerService.setTraceContext({
     trace_id: req.headers['x-trace-id'],
     span_id: req.headers['x-span-id'],
   });
   ```

---

**Happy Logging! 📝**
