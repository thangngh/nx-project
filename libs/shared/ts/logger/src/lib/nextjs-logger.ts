import { winstonLogger, type LogLevel } from './winston-logger.config.ts';

/**
 * NextJS Client-Side Logger
 * Lightweight wrapper around Winston for browser environments
 */

export class NextJSLogger {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  /**
   * Set context
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Log info
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  /**
   * Log error
   */
  error(message: string, error?: Error | string, metadata?: Record<string, any>): void {
    const meta = {
      ...metadata,
      stack: error instanceof Error ? error.stack : error,
      error: error instanceof Error ? error.message : error,
    };
    this.log('error', message, meta);
  }

  /**
   * Log warning
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }

  /**
   * Log debug
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }

  /**
   * Log HTTP
   */
  http(message: string, metadata?: Record<string, any>): void {
    this.log('http', message, metadata);
  }

  /**
   * Generic log method
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    const logData = {
      context: this.context,
      ...metadata,
      // Add browser-specific data
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    winstonLogger.log(level, message, logData);
  }

  /**
   * Log page view
   */
  pageView(path: string, metadata?: Record<string, any>): void {
    this.info('Page view', {
      ...metadata,
      path,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    });
  }

  /**
   * Log user action
   */
  userAction(action: string, metadata?: Record<string, any>): void {
    this.info(`User action: ${action}`, metadata);
  }

  /**
   * Log API call
   */
  apiCall(method: string, url: string, status?: number, duration?: number): void {
    this.http(`API ${method} ${url}`, {
      method,
      url,
      status,
      duration,
    });
  }

  /**
   * Log performance metric
   */
  performance(metric: string, value: number, metadata?: Record<string, any>): void {
    this.debug(`Performance: ${metric}`, {
      ...metadata,
      metric,
      value,
    });
  }
}

/**
 * Create logger instance
 */
export function createNextJSLogger(context?: string): NextJSLogger {
  return new NextJSLogger(context);
}

/**
 * Default logger instance
 */
export const nextLogger = new NextJSLogger();

export default nextLogger;
