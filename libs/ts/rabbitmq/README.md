# @nx-project/rabbitmq

RabbitMQ client library for NestJS applications with background job support.

## Installation

This library is part of the Nx workspace and is automatically available.

## Usage

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

## Features

- Publish/Consume messages
- Job queue abstractions
- Worker helpers
- Dead letter queue support
- Auto-reconnect
- Priority queues
