# Extended Logger - Complete Examples

## 🎯 Overview

Extended Logger cung cấp **13 specialized logging methods** cho các use cases thường gặp trong enterprise applications.

---

## 📦 Setup

```typescript
// app.module.ts
import { ExtendedLoggerModule } from '@nx-project/logger';

@Module({
  imports: [ExtendedLoggerModule],
})
export class AppModule {}
```

```typescript
// any.service.ts
import { ExtendedLoggerService } from '@nx-project/logger';

@Injectable()
export class MyService {
  constructor(private readonly logger: ExtendedLoggerService) {
    this.logger.setContext(MyService.name);
  }
}
```

---

## 1️⃣ Step Logging - Multi-Step Process Tracking

### Use Case: Order Processing Pipeline

```typescript
@Injectable()
export class OrderService {
  constructor(private readonly logger: ExtendedLoggerService) {
    this.logger.setContext(OrderService.name);
  }

  async processOrder(orderId: string) {
    const stepId = `order-${orderId}`;

    // Step 1: Validate
    this.logger.stepBegin(stepId, 'Validate order', { orderId });
    try {
      await this.validateOrder(orderId);
      this.logger.stepComplete(stepId, 'Validate order', 45, { orderId });
    } catch (error) {
      this.logger.stepFailed(stepId, 'Validate order', error);
      throw error;
    }

    // Step 2: Payment
    this.logger.stepBegin(stepId, 'Process payment', { orderId });
    await this.processPayment(orderId);
    this.logger.stepProgress(stepId, 'Process payment', 50);
    this.logger.stepComplete(stepId, 'Process payment', 1234, { orderId });

    // Step 3: Inventory
    this.logger.stepBegin(stepId, 'Update inventory', { orderId });
    await this.updateInventory(orderId);
    this.logger.stepComplete(stepId, 'Update inventory', 89, { orderId });

    // Step 4: Shipping
    this.logger.stepBegin(stepId, 'Create shipping label', { orderId });
    await this.createShippingLabel(orderId);
    this.logger.stepComplete(stepId, 'Create shipping label', 567, { orderId });
  }
}
```

**Console Output:**
```
[STEP BEGIN] Validate order
[STEP COMPLETE] Validate order (45ms)
[STEP BEGIN] Process payment
[STEP PROGRESS] Process payment - 50%
[STEP COMPLETE] Process payment (1234ms)
[STEP BEGIN] Update inventory
[STEP COMPLETE] Update inventory (89ms)
```

---

## 2️⃣ HTTP Request/Response Logging

### Use Case: API Controller

```typescript
@Controller('users')
export class UserController {
  constructor(private readonly logger: ExtendedLoggerService) {
    this.logger.setContext(UserController.name);
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateUserDto) {
    const startTime = Date.now();

    // Log incoming request
    this.logger.httpRequest({
      method: req.method,
      url: req.url,
      headers: req.headers as any,
      body: dto,
      traceId: req.headers['x-trace-id'] as string,
    });

    const user = await this.userService.create(dto);

    // Log response
    this.logger.httpResponse({
      method: req.method,
      url: req.url,
      statusCode: 201,
      duration: Date.now() - startTime,
      traceId: req.headers['x-trace-id'] as string,
    });

    return user;
  }
}
```

**Output:**
```
→ POST /api/users
← POST /api/users 201 (45ms)
```

---

## 3️⃣ Retry Logging

### Use Case: External API with Retry Logic

```typescript
@Injectable()
export class ExternalApiService {
  constructor(private readonly logger: ExtendedLoggerService) {
    this.logger.setContext(ExternalApiService.name);
  }

  async fetchDataWithRetry(url: string) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      
      try {
        return await this.fetch(url);
      } catch (error) {
        const nextRetryIn = Math.pow(2, attempt) * 1000; // Exponential backoff

        this.logger.retry({
          operation: `fetch ${url}`,
          attempt,
          maxRetries,
          error: error.message,
          nextRetryIn,
          backoffStrategy: 'exponential',
        });

        if (attempt >= maxRetries) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, nextRetryIn));
      }
    }
  }
}
```

**Output:**
```
[RETRY 1/3] fetch https://api.example.com/data - Next retry in 2000ms
[RETRY 2/3] fetch https://api.example.com/data - Next retry in 4000ms
[RETRY 3/3] fetch https://api.example.com/data
```

---

## 4️⃣ Exception Logging

### Use Case: Global Exception Filter

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: ExtendedLoggerService) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    if (exception instanceof HttpException) {
      this.logger.exception({
        exceptionType: exception.constructor.name,
        message: exception.message,
        stack: exception.stack,
        context: request.url,
        userId: request.user?.id,
        traceId: request.headers['x-trace-id'],
        handled: true,
      });
    } else {
      this.logger.exception({
        exceptionType: 'UnhandledException',
        message: (exception as Error).message,
        stack: (exception as Error).stack,
        handled: false,
      });
    }
  }
}
```

---

## 5️⃣ Webhook Logging

### Use Case: Payment Provider Webhooks

```typescript
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly logger: ExtendedLoggerService) {
    this.logger.setContext(WebhookController.name);
  }

  @Post('stripe')
  async handleStripeWebhook(@Req() req: Request) {
    const startTime = Date.now();

    // Log incoming webhook
    this.logger.webhookIncoming({
      event: req.body.type,
      source: 'Stripe',
      payload: req.body,
      headers: req.headers as any,
      signature: req.headers['stripe-signature'] as string,
      verified: true,
    });

    await this.processWebhook(req.body);

    return { received: true };
  }

  async sendWebhookToPartner(event: string, data: any) {
    const startTime = Date.now();

    try {
      const response = await fetch('https://partner.com/webhook', {
        method: 'POST',
        body: JSON.stringify({ event, data }),
      });

      this.logger.webhookOutgoing({
        event,
        destination: 'Partner API',
        payload: data,
        statusCode: response.status,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.logger.webhookOutgoing({
        event,
        destination: 'Partner API',
        statusCode: 0,
        duration: Date.now() - startTime,
      });
    }
  }
}
```

**Output:**
```
[WEBHOOK IN] payment.success from Stripe
[WEBHOOK OUT] order.created to Partner API (200)
```

---

## 6️⃣ WebSocket Logging

### Use Case: Real-time Chat

```typescript
@WebSocketGateway()
export class ChatGateway {
  constructor(private readonly logger: ExtendedLoggerService) {
    this.logger.setContext(ChatGateway.name);
  }

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.websocket({
      event: 'connect',
      socketId: client.id,
      userId: client.handshake.auth.userId,
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.websocket({
      event: 'disconnect',
      socketId: client.id,
      userId: client.handshake.auth.userId,
    });
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: string) {
    this.logger.websocket({
      event: 'message',
      socketId: client.id,
      userId: client.handshake.auth.userId,
      room,
      messageType: 'joinRoom',
    });
    
    client.join(room);
  }

  @SubscribeMessage('chatMessage')
  handleMessage(client: Socket, payload: { room: string; message: string }) {
    this.logger.websocket({
      event: 'message',
      socketId: client.id,
      room: payload.room,
      messageType: 'chatMessage',
      payload,
    });
    
    this.server.to(payload.room).emit('message', payload.message);
  }
}
```

**Output:**
```
[WS 🔌] CONNECT
[WS 💬] MESSAGE [room-123] - joinRoom
[WS 💬] MESSAGE [room-123] - chatMessage
[WS 🔴] DISCONNECT
```

---

## 7️⃣ Database Logging

### Use Case: Repository with Query Logging

```typescript
@Injectable()
export class UserRepository {
   constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private readonly logger: ExtendedLoggerService,
  ) {
    this.logger.setContext(UserRepository.name);
  }

  async findAll() {
    const timer = this.logger.startTimer();
    const users = await this.repo.find();
    
    this.logger.database({
      operation: 'query',
      table: 'users',
      duration: timer(),
      rowsAffected: users.length,
    });
    
    return users;
  }

  async create(data: CreateUserDto) {
    const timer = this.logger.startTimer();
    
    try {
      const user = await this.repo.save(data);
      
      this.logger.database({
        operation: 'insert',
        table: 'users',
        duration: timer(),
        rowsAffected: 1,
      });
      
      return user;
    } catch (error) {
      this.logger.database({
        operation: 'insert',
        table: 'users',
        query: `INSERT INTO users...`,
        duration: timer(),
        error: error.message,
      });
      throw error;
    }
  }
}
```

**Output:**
```
[DB QUERY] users (23ms) - 150 rows
[DB INSERT] users (12ms) - 1 rows
```

---

## 8️⃣ Cache Logging

### Use Case: Redis Cache Service

```typescript
@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: ExtendedLoggerService,
  ) {
    this.logger.setContext(CacheService.name);
  }

  async get<T>(key: string): Promise<T | null> {
    const timer = this.logger.startTimer();
    const value = await this.cacheManager.get<T>(key);
    
    this.logger.cache({
      operation: 'get',
      key,
      hit: value !== null,
      duration: timer(),
    });
    
    return value;
  }

  async set(key: string, value: any, ttl: number) {
    const timer = this.logger.startTimer();
    await this.cacheManager.set(key, value, ttl);
    
    this.logger.cache({
      operation: 'set',
      key,
      ttl,
      size: JSON.stringify(value).length,
      duration: timer(),
    });
  }
}
```

**Output:**
```
[CACHE ✅] GET user:123 (2ms)
[CACHE ❌] GET user:456 (3ms)
[CACHE 💾] SET user:789 (5ms)
```

---

## 9️⃣ Queue/Job Logging

### Use Case: Background Job Processing

```typescript
@Processor('emails')
export class EmailProcessor {
  constructor(private readonly logger: ExtendedLoggerService) {
    this.logger.setContext(EmailProcessor.name);
  }

  @Process('sendWelcome')
  async sendWelcomeEmail(job: Job) {
    const timer = this.logger.startTimer();

    this.logger.queue({
      queue: 'emails',
      jobId: job.id.toString(),
      jobType: 'sendWelcome',
      operation: 'process',
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts,
    });

    try {
      await this.sendEmail(job.data);
      
      this.logger.queue({
        queue: 'emails',
        jobId: job.id.toString(),
        jobType: 'sendWelcome',
        operation: 'complete',
        duration: timer(),
      });
    } catch (error) {
      this.logger.queue({
        queue: 'emails',
        jobId: job.id.toString(),
        jobType: 'sendWelcome',
        operation: 'failed',
        error: error.message,
        duration: timer(),
      });
      throw error;
    }
  }
}
```

**Output:**
```
[QUEUE ⚙️] emails/sendWelcome - Attempt 1/3
[QUEUE ✅] emails/sendWelcome (245ms)
```

---

## 🔟 External API Logging

### Use Case: Third-party API Client

```typescript
@Injectable()
export class GitHubApiClient {
  constructor(private readonly logger: ExtendedLoggerService) {
    this.logger.setContext(GitHubApiClient.name);
  }

  async getRepository(owner: string, repo: string) {
    const timer = this.logger.startTimer();
    const endpoint = `/repos/${owner}/${repo}`;

    try {
      const response = await fetch(`https://api.github.com${endpoint}`);
      
      this.logger.externalApi({
        service: 'GitHub',
        endpoint,
        method: 'GET',
        duration: timer(),
        statusCode: response.status,
      });
      
      return response.json();
    } catch (error) {
      this.logger.externalApi({
        service: 'GitHub',
        endpoint,
        method: 'GET',
        duration: timer(),
        error: error.message,
      });
      throw error;
    }
  }
}
```

**Output:**
```
[API EXT] GitHub GET /repos/owner/repo (234ms)
```

---

## 1️⃣1️⃣ Authentication Logging

### Use Case: Auth Service

```typescript
@Injectable()
export class AuthService {
  constructor(private readonly logger: ExtendedLoggerService) {
    this.logger.setContext(AuthService.name);
  }

  async login(email: string, password: string, req: Request) {
    try {
      const user = await this.validateCredentials(email, password);
      
      this.logger.auth({
        event: 'login',
        userId: user.id,
        email,
        success: true,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        mfa: user.mfaEnabled,
      });
      
      return this.generateToken(user);
    } catch (error) {
      this.logger.auth({
        event: 'login',
        email,
        success: false,
        reason: error.message,
        ip: req.ip,
      });
      throw error;
    }
  }

  async checkPermission(userId: string, resource: string, action: string) {
    const hasPermission = await this.permissionService.check(userId, resource, action);
    
    this.logger.auth({
      event: 'permissionCheck',
      userId,
      success: hasPermission,
      reason: hasPermission ? undefined : 'Access denied',
    });
    
    return hasPermission;
  }
}
```

**Output:**
```
[AUTH 🔐] LOGIN - user@example.com - SUCCESS [MFA]
[AUTH 🔍] PERMISSIONCHECK - FAILED
```

---

## 1️⃣2️⃣ File Operation Logging

### Use Case: File Upload Service

```typescript
@Injectable()
export class FileService {
  constructor(private readonly logger: ExtendedLoggerService) {
    this.logger.setContext(FileService.name);
  }

  async uploadFile(file: Express.Multer.File, userId: string) {
    const timer = this.logger.startTimer();

    try {
      const destination = await this.s3.upload(file);
      
      this.logger.fileOperation({
        operation: 'upload',
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        destination,
        userId,
        duration: timer(),
      });
      
      return destination;
    } catch (error) {
      this.logger.fileOperation({
        operation: 'upload',
        fileName: file.originalname,
        fileSize: file.size,
        userId,
        error: error.message,
        duration: timer(),
      });
      throw error;
    }
  }
}
```

**Output:**
```
[FILE ⬆️] UPLOAD avatar.jpg (2.05MB) - 567ms
```

---

## 1️⃣3️⃣ Payment Logging

### Use Case: Payment Service

```typescript
@Injectable()
export class PaymentService {
  constructor(private readonly logger: ExtendedLoggerService) {
    this.logger.setContext(PaymentService.name);
  }

  async chargeCard(amount: number, currency: string, userId: string) {
    try {
      const result = await this.stripe.charges.create({
        amount: amount * 100,
        currency,
        source: 'tok_visa',
      });
      
      this.logger.payment({
        transactionId: result.id,
        operation: 'charge',
        amount,
        currency,
        paymentMethod: 'card',
        status: 'success',
        provider: 'Stripe',
        userId,
      });
      
      return result;
    } catch (error) {
      this.logger.payment({
        transactionId: 'failed',
        operation: 'charge',
        amount,
        currency,
        paymentMethod: 'card',
        status: 'failed',
        provider: 'Stripe',
        userId,
        error: error.message,
      });
      throw error;
    }
  }
}
```

**Output:**
```
[PAYMENT 💳] CHARGE 99.99 USD via card - SUCCESS [Stripe]
```

---

## 🛠️ Utility Methods

### logExecution - Auto-timing

```typescript
async processOrder(orderId: string) {
  return this.logger.logExecution(
    'Process Order',
    async () => {
      // Your business logic here
      await this.validateOrder(orderId);
      await this.chargePayment(orderId);
      await this.createShipment(orderId);
      return { success: true };
    },
    { orderId }
  );
}
```

**Output:**
```
[START] Process Order
[COMPLETE] Process Order (2345ms)
```

### startTimer - Manual timing

```typescript
const timer = this.logger.startTimer();
await this.doSomething();
const duration = timer();
this.logger.log(`Operation took ${duration}ms`);
```

---

## 📊 Complete Example: E-commerce Order Flow

```typescript
@Injectable()
export class OrderService {
  constructor(
    private readonly logger: ExtendedLoggerService,
    private readonly paymentService: PaymentService,
    private readonly inventoryService: InventoryService,
    private readonly shippingService: ShippingService,
  ) {
    this.logger.setContext(OrderService.name);
  }

  async createOrder(dto: CreateOrderDto, userId: string) {
    const orderId = uuid();
    const stepId = `order-${orderId}`;

    // Step 1: Validate
    this.logger.stepBegin(stepId, 'Validate order', { orderId, userId });
    await this.validateOrder(dto);
    this.logger.stepComplete(stepId, 'Validate order', 23);

    // Step 2: Check inventory
    this.logger.stepBegin(stepId, 'Check inventory', { orderId });
    const available = await this.inventoryService.checkStock(dto.items);
    this.logger.database({
      operation: 'query',
      table: 'inventory',
      duration: 34,
      rowsAffected: dto.items.length,
    });
    this.logger.stepComplete(stepId, 'Check inventory', 34);

    // Step 3: Process payment
    this.logger.stepBegin(stepId, 'Process payment', { orderId });
    const payment = await this.paymentService.charge(dto.amount, dto.currency, userId);
    this.logger.payment({
      transactionId: payment.id,
      operation: 'charge',
      amount: dto.amount,
      currency: dto.currency,
      paymentMethod: 'card',
      status: 'success',
      userId,
    });
    this.logger.stepComplete(stepId, 'Process payment', 1234);

    // Step 4: Update inventory
    this.logger.stepBegin(stepId, 'Update inventory', { orderId });
    await this.inventoryService.deduct(dto.items);
    this.logger.database({
      operation: 'update',
      table: 'inventory',
      duration: 45,
      rowsAffected: dto.items.length,
    });
    this.logger.stepComplete(stepId, 'Update inventory', 45);

    // Step 5: Create shipping
    this.logger.stepBegin(stepId, 'Create shipping', { orderId });
    const shipping = await this.shippingService.createLabel(orderId);
    this.logger.externalApi({
      service: 'ShipStation',
      endpoint: '/labels',
      method: 'POST',
      duration: 567,
      statusCode: 201,
    });
    this.logger.stepComplete(stepId, 'Create shipping', 567);

    // Step 6: Send webhooks
    await this.sendOrderWebhook(orderId, 'order.created');

    // Save to database
    const timer = this.logger.startTimer();
    await this.orderRepo.save({ id: orderId, ...dto });
    this.logger.database({
      operation: 'insert',
      table: 'orders',
      duration: timer(),
      rowsAffected: 1,
    });

    // Cache order
    await this.cacheService.set(`order:${orderId}`, { id: orderId, ...dto }, 3600);
    this.logger.cache({
      operation: 'set',
      key: `order:${orderId}`,
      ttl: 3600,
    });

    return { orderId, status: 'created' };
  }

  private async sendOrderWebhook(orderId: string, event: string) {
    const timer = this.logger.startTimer();
    
    try {
      const response = await fetch('https://partner.com/webhook', {
        method: 'POST',
        body: JSON.stringify({ event, orderId }),
      });
      
      this.logger.webhookOutgoing({
        event,
        destination: 'Partner',
        statusCode: response.status,
        duration: timer(),
      });
    } catch (error) {
      this.logger.webhookOutgoing({
        event,
        destination: 'Partner',
        duration: timer(),
      });
    }
  }
}
```

---

**Complete logging solution! 🎉📝**
