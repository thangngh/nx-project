import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import type { LogEntry, LogMetadata } from './logger.interface.ts';

/**
 * JSON-based structured logger for NestJS
 * Compatible with Grafana Loki and other log aggregation systems
 */
@Injectable({ scope: Scope.TRANSIENT })
export class JsonLoggerService implements LoggerService {
  private context?: string;
  private static asyncLocalStorage = new AsyncLocalStorage<LogMetadata>();

  constructor(context?: string) {
    this.context = context;
  }

  /**
   * Set context for this logger instance
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Get current trace context from AsyncLocalStorage
   */
  private getTraceContext(): LogMetadata {
    return JsonLoggerService.asyncLocalStorage.getStore() || {};
  }

  /**
   * Set trace context for current execution
   */
  static setTraceContext(metadata: LogMetadata): void {
    const store = JsonLoggerService.asyncLocalStorage.getStore() || {};
    JsonLoggerService.asyncLocalStorage.enterWith({ ...store, ...metadata });
  }

  /**
   * Run function with trace context
   */
  static runWithContext<T>(metadata: LogMetadata, fn: () => T): T {
    return JsonLoggerService.asyncLocalStorage.run(metadata, fn);
  }

  /**
   * Format log entry as JSON
   */
  private formatLog(
    level: LogEntry['level'],
    message: any,
    context?: string,
    trace?: string,
    metadata?: Record<string, any>
  ): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: typeof message === 'object' ? JSON.stringify(message) : String(message),
      context: context || this.context,
      metadata: {
        ...this.getTraceContext(),
        ...metadata,
      },
    };

    if (trace) {
      entry.trace = trace;
    }

    return JSON.stringify(entry);
  }

  /**
   * Log info message
   */
  log(message: any, context?: string): void;
  log(message: any, metadata?: Record<string, any>, context?: string): void;
  log(message: any, contextOrMetadata?: string | Record<string, any>, context?: string): void {
    const isMetadata = typeof contextOrMetadata === 'object';
    const logContext = isMetadata ? context : contextOrMetadata;
    const metadata = isMetadata ? contextOrMetadata : undefined;

    console.log(this.formatLog('info', message, logContext, undefined, metadata));
  }

  /**
   * Log error message
   */
  error(message: any, trace?: string, context?: string): void;
  error(message: any, trace?: string, metadata?: Record<string, any>, context?: string): void;
  error(
    message: any,
    trace?: string,
    contextOrMetadata?: string | Record<string, any>,
    context?: string
  ): void {
    const isMetadata = typeof contextOrMetadata === 'object';
    const logContext = isMetadata ? context : contextOrMetadata;
    const metadata = isMetadata ? contextOrMetadata : undefined;

    console.error(this.formatLog('error', message, logContext, trace, metadata));
  }

  /**
   * Log warning message
   */
  warn(message: any, context?: string): void;
  warn(message: any, metadata?: Record<string, any>, context?: string): void;
  warn(message: any, contextOrMetadata?: string | Record<string, any>, context?: string): void {
    const isMetadata = typeof contextOrMetadata === 'object';
    const logContext = isMetadata ? context : contextOrMetadata;
    const metadata = isMetadata ? contextOrMetadata : undefined;

    console.warn(this.formatLog('warn', message, logContext, undefined, metadata));
  }

  /**
   * Log debug message
   */
  debug(message: any, context?: string): void;
  debug(message: any, metadata?: Record<string, any>, context?: string): void;
  debug(message: any, contextOrMetadata?: string | Record<string, any>, context?: string): void {
    const isMetadata = typeof contextOrMetadata === 'object';
    const logContext = isMetadata ? context : contextOrMetadata;
    const metadata = isMetadata ? contextOrMetadata : undefined;

    console.debug(this.formatLog('debug', message, logContext, undefined, metadata));
  }

  /**
   * Log verbose message
   */
  verbose(message: any, context?: string): void;
  verbose(message: any, metadata?: Record<string, any>, context?: string): void;
  verbose(message: any, contextOrMetadata?: string | Record<string, any>, context?: string): void {
    const isMetadata = typeof contextOrMetadata === 'object';
    const logContext = isMetadata ? context : contextOrMetadata;
    const metadata = isMetadata ? contextOrMetadata : undefined;

    console.log(this.formatLog('verbose', message, logContext, undefined, metadata));
  }

  /**
   * Log with custom metadata
   */
  logWithMetadata(
    level: LogEntry['level'],
    message: any,
    metadata: Record<string, any>,
    context?: string
  ): void {
    const formatted = this.formatLog(level, message, context, undefined, metadata);

    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'debug':
        console.debug(formatted);
        break;
      default:
        console.log(formatted);
    }
  }
}
