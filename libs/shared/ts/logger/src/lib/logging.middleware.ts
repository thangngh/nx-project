import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JsonLoggerService } from './json-logger.service.ts';
import { randomUUID } from 'crypto';

/**
 * Middleware to capture and propagate trace context
 * Automatically extracts or generates trace_id, span_id, and request_id
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: JsonLoggerService) {
    this.logger.setContext('LoggingMiddleware');
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    // Extract or generate trace context
    const trace_id = (req.headers['x-trace-id'] as string) || randomUUID();
    const span_id = (req.headers['x-span-id'] as string) || randomUUID();
    const request_id = (req.headers['x-request-id'] as string) || randomUUID();
    const user_id = (req as any).user?.id;

    // Set trace context for this request
    JsonLoggerService.runWithContext(
      {
        trace_id,
        span_id,
        request_id,
        user_id,
      },
      () => {
        // Log incoming request
        this.logger.logWithMetadata(
          'info',
          `Incoming ${req.method} ${req.url}`,
          {
            method: req.method,
            url: req.url,
            user_agent: req.headers['user-agent'],
            ip: req.ip,
          },
          'HTTP'
        );

        // Log response when finished
        res.on('finish', () => {
          const duration = Date.now() - startTime;
          const level = res.statusCode >= 400 ? 'error' : res.statusCode >= 300 ? 'warn' : 'info';

          this.logger.logWithMetadata(
            level,
            `${req.method} ${req.url} ${res.statusCode} ${duration}ms`,
            {
              method: req.method,
              url: req.url,
              status: res.statusCode,
              duration,
              content_length: res.get('content-length'),
            },
            'HTTP'
          );
        });

        next();
      }
    );
  }
}
