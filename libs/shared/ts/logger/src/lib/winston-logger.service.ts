import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { winstonLogger, createLogger, type LogLevel } from './winston-logger.config.ts';
import type { LogMetadata } from './logger.interface.ts';

/**
 * NestJS Winston Logger Service
 * Implements NestJS LoggerService interface with Winston backend
 */
@Injectable({ scope: Scope.TRANSIENT })
export class WinstonLoggerService implements LoggerService {
  private context?: string;
  private logger: typeof winstonLogger;
  private static asyncLocalStorage = new AsyncLocalStorage<LogMetadata>();

  constructor(context?: string) {
    this.context = context;
    this.logger = context ? createLogger(context) : winstonLogger;
  }

  /**
   * Set context for this logger instance
   */
  setContext(context: string): void {
    this.context = context;
    this.logger = createLogger(context);
  }

  /**
   * Get current trace context from AsyncLocalStorage
   */
  private getTraceContext(): LogMetadata {
    return WinstonLoggerService.asyncLocalStorage.getStore() || {};
  }

  /**
   * Set trace context for current execution
   */
  static setTraceContext(metadata: LogMetadata): void {
    const store = WinstonLoggerService.asyncLocalStorage.getStore() || {};
    WinstonLoggerService.asyncLocalStorage.enterWith({ ...store, ...metadata });
  }

  /**
   * Run function with trace context
   */
  static runWithContext<T>(metadata: LogMetadata, fn: () => T): T {
    return WinstonLoggerService.asyncLocalStorage.run(metadata, fn);
  }

  /**
   * Merge trace context with additional metadata
   */
  private mergeMetadata(metadata?: Record<string, any>): Record<string, any> {
    return {
      ...this.getTraceContext(),
      ...metadata,
    };
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

    this.logger.info(message, {
      context: logContext || this.context,
      metadata: this.mergeMetadata(metadata),
    });
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

    this.logger.error(message, {
      context: logContext || this.context,
      stack: trace,
      metadata: this.mergeMetadata(metadata),
    });
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

    this.logger.warn(message, {
      context: logContext || this.context,
      metadata: this.mergeMetadata(metadata),
    });
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

    this.logger.debug(message, {
      context: logContext || this.context,
      metadata: this.mergeMetadata(metadata),
    });
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

    this.logger.debug(message, {
      context: logContext || this.context,
      metadata: this.mergeMetadata(metadata),
    });
  }

  /**
   * Log HTTP request
   */
  http(message: string, metadata?: Record<string, any>): void {
    this.logger.http(message, {
      context: this.context,
      metadata: this.mergeMetadata(metadata),
    });
  }

  /**
   * Log with custom level
   */
  logWithLevel(
    level: LogLevel,
    message: any,
    metadata?: Record<string, any>,
    context?: string
  ): void {
    this.logger.log(level, message, {
      context: context || this.context,
      metadata: this.mergeMetadata(metadata),
    });
  }
}
