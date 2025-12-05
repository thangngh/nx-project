import { Module, Global } from '@nestjs/common';
import { JsonLoggerService } from './json-logger.service.ts';

/**
 * Logger module providing JSON structured logging
 * 
 * Usage:
 * 
 * Import in your app module:
 * @Module({
 *   imports: [LoggerModule],
 * })
 * 
 * Use in services:
 * constructor(private readonly logger: JsonLoggerService) {
 *   this.logger.setContext('MyService');
 * }
 */
@Global()
@Module({
  providers: [JsonLoggerService],
  exports: [JsonLoggerService],
})
export class LoggerModule { }
