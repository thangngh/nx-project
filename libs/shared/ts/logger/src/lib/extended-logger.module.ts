import { Module, Global } from '@nestjs/common';
import { WinstonLoggerService } from './winston-logger.service.ts';
import { ExtendedLoggerService } from './extended-logger.service.ts';

/**
 * Extended Logger Module for NestJS
 * 
 * Provides specialized logging methods for:
 * - ✅ Step/Process tracking (begin, progress, complete, failed)
 * - ✅ HTTP Request/Response
 * - ✅ Retry logic
 * - ✅ Exception handling
 * - ✅ Webhooks (incoming/outgoing)
 * - ✅ WebSockets
 * - ✅ Database operations
 * - ✅ Cache operations
 * - ✅ Queue/Job processing
 * - ✅ External API calls
 * - ✅ Authentication
 * - ✅ File operations
 * - ✅ Payments
 * 
 * Usage:
 * 
 * @Module({
 *   imports: [ExtendedLoggerModule],
 * })
 * export class AppModule {}
 * 
 * In services:
 * constructor(private readonly logger: ExtendedLoggerService) {
 *   this.logger.setContext(MyService.name);
 * }
 * 
 * Examples:
 * 
 * // Step tracking
 * logger.stepBegin('step-1', 'Processing payment');
 * logger.stepComplete('step-1', 'Processing payment', 1234);
 * 
 * // HTTP logging
 * logger.httpRequest({ method: 'POST', url: '/api/users' });
 * logger.httpResponse({ method: 'POST', url: '/api/users', statusCode: 201, duration: 45 });
 * 
 * // Retry logging
 * logger.retry({ operation: 'fetchUserData', attempt: 2, maxRetries: 3 });
 * 
 * // Webhook logging
 * logger.webhookIncoming({ event: 'payment.success', source: 'stripe' });
 * logger.webhookOutgoing({ event: 'order.created', destination: 'inventory-service', statusCode: 200 });
 * 
 * // WebSocket logging
 * logger.websocket({ event: 'connect', socketId: 'socket-123', userId: 'user-456' });
 * logger.websocket({ event: 'message', socketId: 'socket-123', messageType: 'chat', payload: {...} });
 * 
 * // Database logging
 * logger.database({ operation: 'query', table: 'users', duration: 23, rowsAffected: 5 });
 * 
 * // Cache logging
 * logger.cache({ operation: 'get', key: 'user:123', hit: true, duration: 2 });
 * 
 * // Queue logging
 * logger.queue({ queue: 'emails', jobId: 'job-123', jobType: 'sendWelcomeEmail', operation: 'enqueue' });
 * 
 * // External API logging
 * logger.externalApi({ service: 'GitHub', endpoint: '/repos', method: 'GET', duration: 234, statusCode: 200 });
 * 
 * // Auth logging
 * logger.auth({ event: 'login', email: 'user@example.com', success: true, ip: '192.168.1.1' });
 * 
 * // File operation logging
 * logger.fileOperation({ operation: 'upload', fileName: 'avatar.jpg', fileSize: 2048000, duration: 567 });
 * 
 * // Payment logging
 * logger.payment({ transactionId: 'txn-123', operation: 'charge', amount: 99.99, currency: 'USD', status: 'success', paymentMethod: 'card' });
 * 
 * // Exception logging
 * logger.exception({ exceptionType: 'ValidationException', message: 'Invalid email', context: 'UserService' });
 */
@Global()
@Module({
  providers: [WinstonLoggerService, ExtendedLoggerService],
  exports: [WinstonLoggerService, ExtendedLoggerService],
})
export class ExtendedLoggerModule { }
