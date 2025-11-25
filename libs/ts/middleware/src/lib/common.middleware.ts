import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      console.log(`[${method}] ${originalUrl} - ${statusCode} - ${duration}ms`);
    });

    next();
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] || this.generateId();
    req.headers['x-correlation-id'] = correlationId as string;
    res.setHeader('x-correlation-id', correlationId);
    next();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

@Injectable()
export class TimeoutMiddleware implements NestMiddleware {
  constructor(private readonly timeoutMs: number = 30000) { }

  use(req: Request, res: Response, next: NextFunction) {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          message: 'Request timeout',
          statusCode: 408,
        });
      }
    }, this.timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  }
}
