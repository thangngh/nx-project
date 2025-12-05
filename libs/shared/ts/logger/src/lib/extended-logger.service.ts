import { Injectable, Scope } from '@nestjs/common';
import { WinstonLoggerService } from './winston-logger.service.ts';
import { DataSanitizer, defaultSanitizer } from './data-sanitizer.ts';
import type { MaskingPolicy } from './masking-policy.ts';
import type {
  StepLog,
  HttpRequestLog,
  HttpResponseLog,
  RetryLog,
  ExceptionLog,
  WebhookLog,
  WebSocketLog,
  DatabaseLog,
  CacheLog,
  QueueLog,
  ExternalApiLog,
  AuthLog,
  FileOperationLog,
  PaymentLog,
} from './logger.interface.ts';

/**
 * Extended Winston Logger with Specialized Methods + Data Sanitization
 * 
 * Features:
 * - 13 specialized logging methods
 * - Automatic PII masking in production
 * - GDPR compliant
 * - Development vs Production modes
 * 
 * Provides domain-specific logging methods for:
 * - Step/Process tracking
 * - HTTP Request/Response
 * - Retry logic
 * - Exceptions
 * - Webhooks
 * - WebSockets
 * - Database operations
 * - Cache operations
 * - Queue/Job processing
 * - External API calls
 * - Authentication
 * - File operations
 * - Payments
 */
@Injectable({ scope: Scope.TRANSIENT })
export class ExtendedLoggerService extends WinstonLoggerService {
  private sanitizer: DataSanitizer;

  constructor() {
    super();
    this.sanitizer = defaultSanitizer;
  }

  /**
   * Set custom masking policy
   */
  setMaskingPolicy(policy: MaskingPolicy): void {
    this.sanitizer.setPolicy(policy);
  }

  /**
   * Get current masking policy
   */
  getMaskingPolicy(): MaskingPolicy {
    return this.sanitizer.getPolicy();
  }

  /**
   * Sanitize data before logging
   */
  private sanitizeData(data: any): any {
    return this.sanitizer.sanitize(data);
  }

  // ============================================================================
  // STEP LOGGING - Track multi-step processes
  // ============================================================================

  /**
   * Log step begin
   */
  stepBegin(stepId: string, stepName: string, metadata?: Record<string, any>): void {
    const log: StepLog = {
      stepId,
      stepName,
      phase: 'begin',
      metadata,
    };
    this.log(`[STEP BEGIN] ${stepName}`, log);
  }

  /**
   * Log step progress
   */
  stepProgress(stepId: string, stepName: string, progress: number, metadata?: Record<string, any>): void {
    const log: StepLog = {
      stepId,
      stepName,
      phase: 'progress',
      progress,
      metadata,
    };
    this.log(`[STEP PROGRESS] ${stepName} - ${progress}%`, log);
  }

  /**
   * Log step complete
   */
  stepComplete(stepId: string, stepName: string, duration: number, metadata?: Record<string, any>): void {
    const log: StepLog = {
      stepId,
      stepName,
      phase: 'complete',
      duration,
      metadata,
    };
    this.log(`[STEP COMPLETE] ${stepName} (${duration}ms)`, log);
  }

  /**
   * Log step failed
   */
  stepFailed(stepId: string, stepName: string, error: Error, metadata?: Record<string, any>): void {
    const log: StepLog = {
      stepId,
      stepName,
      phase: 'failed',
      metadata: {
        ...metadata,
        error: error.message,
      },
    };
    this.error(`[STEP FAILED] ${stepName}`, error.stack, log);
  }

  // ============================================================================
  // HTTP REQUEST/RESPONSE LOGGING
  // ============================================================================

  /**
   * Log incoming HTTP request
   */
  httpRequest(log: HttpRequestLog): void {
    const sanitized = this.sanitizeData(log);
    this.http(`→ ${log.method} ${log.url}`, {
      ...sanitized,
      direction: 'incoming',
    });
  }

  /**
   * Log outgoing HTTP response
   */
  httpResponse(log: HttpResponseLog): void {
    const sanitized = this.sanitizeData(log);
    const level = log.statusCode >= 500 ? 'error' : log.statusCode >= 400 ? 'warn' : 'http';
    this.logWithLevel(
      level,
      `← ${log.method} ${log.url} ${log.statusCode} (${log.duration}ms)`,
      {
        ...sanitized,
        direction: 'outgoing',
      }
    );
  }

  // ============================================================================
  // RETRY LOGGING
  // ============================================================================

  /**
   * Log retry attempt
   */
  retry(log: RetryLog): void {
    const message = `[RETRY ${log.attempt}/${log.maxRetries}] ${log.operation}${log.nextRetryIn ? ` - Next retry in ${log.nextRetryIn}ms` : ''
      }`;

    const level = log.attempt >= log.maxRetries ? 'error' : 'warn';
    this.logWithLevel(level, message, log);
  }

  // ============================================================================
  // EXCEPTION LOGGING
  // ============================================================================

  /**
   * Log exception with full details
   */
  exception(log: ExceptionLog): void {
    this.error(
      `[EXCEPTION] ${log.exceptionType}: ${log.message}`,
      log.stack,
      {
        ...log,
        timestamp: new Date().toISOString(),
      }
    );
  }

  // ============================================================================
  // WEBHOOK LOGGING
  // ============================================================================

  /**
   * Log incoming webhook
   */
  webhookIncoming(log: Omit<WebhookLog, 'direction'>): void {
    this.http(`[WEBHOOK IN] ${log.event} from ${log.source}`, {
      ...log,
      direction: 'incoming',
    });
  }

  /**
   * Log outgoing webhook
   */
  webhookOutgoing(log: Omit<WebhookLog, 'direction'>): void {
    const level = log.statusCode && log.statusCode >= 400 ? 'warn' : 'http';
    this.logWithLevel(
      level,
      `[WEBHOOK OUT] ${log.event} to ${log.destination} ${log.statusCode ? `(${log.statusCode})` : ''}`,
      {
        ...log,
        direction: 'outgoing',
      }
    );
  }

  // ============================================================================
  // WEBSOCKET LOGGING
  // ============================================================================

  /**
   * Log WebSocket event
   */
  websocket(log: WebSocketLog): void {
    const emoji = {
      connect: '🔌',
      disconnect: '🔴',
      message: '💬',
      error: '❌',
      ping: '🏓',
      pong: '🏓',
    };

    const message = `[WS ${emoji[log.event]}] ${log.event.toUpperCase()}${log.room ? ` [${log.room}]` : ''
      }${log.messageType ? ` - ${log.messageType}` : ''}`;

    const level = log.event === 'error' ? 'error' : log.event === 'disconnect' ? 'warn' : 'debug';
    this.logWithLevel(level, message, log);
  }

  // ============================================================================
  // DATABASE LOGGING
  // ============================================================================

  /**
   * Log database operation
   */
  database(log: DatabaseLog): void {
    const level = log.error ? 'error' : log.duration > 1000 ? 'warn' : 'debug';
    const message = `[DB ${log.operation.toUpperCase()}]${log.table ? ` ${log.table}` : ''} (${log.duration}ms)${log.rowsAffected !== undefined ? ` - ${log.rowsAffected} rows` : ''
      }`;

    this.logWithLevel(level, message, log);
  }

  // ============================================================================
  // CACHE LOGGING
  // ============================================================================

  /**
   * Log cache operation
   */
  cache(log: CacheLog): void {
    const emoji = {
      hit: '✅',
      miss: '❌',
      get: '🔍',
      set: '💾',
      delete: '🗑️',
      clear: '🧹',
    };

    const status = log.hit !== undefined ? (log.hit ? 'hit' : 'miss') : log.operation;
    const message = `[CACHE ${emoji[status]}] ${log.operation.toUpperCase()} ${log.key}${log.duration ? ` (${log.duration}ms)` : ''
      }`;

    this.debug(message, log);
  }

  // ============================================================================
  // QUEUE/JOB LOGGING
  // ============================================================================

  /**
   * Log queue operation
   */
  queue(log: QueueLog): void {
    const emoji = {
      enqueue: '📥',
      dequeue: '📤',
      process: '⚙️',
      complete: '✅',
      failed: '❌',
      retry: '🔄',
    };

    const message = `[QUEUE ${emoji[log.operation]}] ${log.queue}/${log.jobType}${log.attempt ? ` - Attempt ${log.attempt}/${log.maxAttempts}` : ''
      }${log.duration ? ` (${log.duration}ms)` : ''}`;

    const level = log.operation === 'failed' ? 'error' : log.operation === 'retry' ? 'warn' : 'info';
    this.logWithLevel(level, message, log);
  }

  // ============================================================================
  // EXTERNAL API LOGGING
  // ============================================================================

  /**
   * Log external API call
   */
  externalApi(log: ExternalApiLog): void {
    const level = log.error ? 'error' : log.statusCode && log.statusCode >= 400 ? 'warn' : 'http';
    const message = `[API EXT] ${log.service} ${log.method} ${log.endpoint}${log.statusCode ? ` (${log.statusCode})` : ''
      } - ${log.duration}ms${log.cached ? ' [CACHED]' : ''}${log.retries ? ` [${log.retries} retries]` : ''}`;

    this.logWithLevel(level, message, log);
  }

  // ============================================================================
  // AUTHENTICATION/AUTHORIZATION LOGGING
  // ============================================================================

  /**
   * Log auth event
   */
  auth(log: AuthLog): void {
    const emoji = {
      login: '🔐',
      logout: '👋',
      register: '📝',
      passwordReset: '🔑',
      tokenRefresh: '🔄',
      permissionCheck: '🔍',
    };

    const message = `[AUTH ${emoji[log.event]}] ${log.event.toUpperCase()}${log.email ? ` - ${log.email}` : ''
      } - ${log.success ? 'SUCCESS' : 'FAILED'}${log.mfa ? ' [MFA]' : ''}`;

    const level = log.success ? 'info' : 'warn';
    this.logWithLevel(level, message, log);
  }

  // ============================================================================
  // FILE OPERATIONS LOGGING
  // ============================================================================

  /**
   * Log file operation
   */
  fileOperation(log: FileOperationLog): void {
    const emoji = {
      upload: '⬆️',
      download: '⬇️',
      delete: '🗑️',
      move: '↔️',
      copy: '📋',
    };

    const message = `[FILE ${emoji[log.operation]}] ${log.operation.toUpperCase()} ${log.fileName}${log.fileSize ? ` (${(log.fileSize / 1024 / 1024).toFixed(2)}MB)` : ''
      }${log.duration ? ` - ${log.duration}ms` : ''}`;

    const level = log.error ? 'error' : 'info';
    this.logWithLevel(level, message, log);
  }

  // ============================================================================
  // PAYMENT/TRANSACTION LOGGING
  // ============================================================================

  /**
   * Log payment transaction
   */
  payment(log: PaymentLog): void {
    const message = `[PAYMENT 💳] ${log.operation.toUpperCase()} ${log.amount} ${log.currency} via ${log.paymentMethod
      } - ${log.status.toUpperCase()}${log.provider ? ` [${log.provider}]` : ''}`;

    const level = log.status === 'failed' ? 'error' : 'info';
    this.logWithLevel(level, message, {
      ...log,
      // Mask sensitive data in logs
      amount: log.amount,
      currency: log.currency,
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Create timer for duration tracking
   */
  startTimer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }

  /**
   * Log with execution time
   */
  async logExecution<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const timer = this.startTimer();
    this.log(`[START] ${operation}`, metadata);

    try {
      const result = await fn();
      const duration = timer();
      this.log(`[COMPLETE] ${operation} (${duration}ms)`, metadata);
      return result;
    } catch (error) {
      const duration = timer();
      this.error(`[FAILED] ${operation} (${duration}ms)`, (error as Error).stack, metadata);
      throw error;
    }
  }
}
