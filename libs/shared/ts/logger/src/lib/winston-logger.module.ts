import { Module, Global } from '@nestjs/common';
import { WinstonLoggerService } from './winston-logger.service.ts';

/**
 * Winston Logger Module for NestJS
 * 
 * Features:
 * - File rotation (daily)
 * - Multiple transports (console, file, error file)
 * - Structured logging
 * - Trace context support
 * - Production-ready
 * 
 * Usage:
 * 
 * @Module({
 *   imports: [WinstonLoggerModule],
 * })
 * export class AppModule {}
 * 
 * In services:
 * constructor(private readonly logger: WinstonLoggerService) {
 *   this.logger.setContext(MyService.name);
 * }
 */
@Global()
@Module({
  providers: [WinstonLoggerService],
  exports: [WinstonLoggerService],
})
export class WinstonLoggerModule { }
