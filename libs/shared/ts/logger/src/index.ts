// Legacy types (keeping for backward compatibility)
export { LogType } from './lib/types/log.types.ts';
export type { LogLevel as LegacyLogLevel } from './lib/types/log.types.ts';
export type {
  BaseLog,
  HttpLog,
  WebhookLog as LegacyWebhookLog,
  SystemLog
} from './lib/interfaces/log-payload.interface.ts';

// JSON logger (Loki-compatible)
export * from './lib/json-logger.service.ts';
export * from './lib/logging.middleware.ts';

// Winston-based loggers (enhanced)
export * from './lib/winston-logger.config.ts';
export * from './lib/winston-logger.service.ts';
export * from './lib/winston-logger.module.ts';
export * from './lib/nextjs-logger.ts';

// Extended Logger (with specialized methods - RECOMMENDED)
export * from './lib/extended-logger.service.ts';
export * from './lib/extended-logger.module.ts';

// Comprehensive logger interfaces
export * from './lib/logger.interface.ts';

// Data Masking & Sanitization (GDPR compliant)
export * from './lib/masking-policy.ts';
export * from './lib/data-sanitizer.ts';

// Security & IP Tracking
export * from './lib/ip-tracker.ts';
export * from './lib/security-logger.service.ts';
export * from './lib/security-logger.module.ts';
