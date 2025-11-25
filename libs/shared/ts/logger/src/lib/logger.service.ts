import { Injectable, Scope } from '@nestjs/common';
import * as winston from 'winston';
import { customFormat, prettyFormat } from './format/winston.format.ts';
import { LogType } from './types/log.types.ts';
import { HttpLog, WebhookLog, SystemLog } from './interfaces/log-payload.interface.ts';

export interface LoggerConfig {
  mode: 'file' | 'third-party';
  filePath?: string;
  level?: string;
}

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  private logger!: winston.Logger;
  private context?: string;

  constructor(private config: LoggerConfig = { mode: 'third-party', level: 'info' }) {
    this.initializeLogger();
  }

  setContext(context: string) {
    this.context = context;
  }

  private initializeLogger() {
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          prettyFormat
        ),
      }),
    ];

    if (this.config.mode === 'file' && this.config.filePath) {
      transports.push(
        new winston.transports.File({
          filename: this.config.filePath,
          format: winston.format.combine(winston.format.timestamp(), customFormat),
        })
      );
    }

    // Placeholder for third-party transport
    if (this.config.mode === 'third-party') {
      // Add third-party transport here (e.g., HTTP, Datadog, etc.)
      // transports.push(new ThirdPartyTransport());
    }

    this.logger = winston.createLogger({
      level: this.config.level || 'info',
      transports,
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context: context || this.context, type: LogType.DEBUG });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context: context || this.context, type: LogType.ERROR });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context: context || this.context, type: LogType.DEBUG });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context: context || this.context, type: LogType.DEBUG });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context: context || this.context, type: LogType.DEBUG });
  }

  logHttp(payload: Omit<HttpLog, 'type' | 'level' | 'timestamp'>) {
    this.logger.info(payload.message, { ...payload, type: LogType.HTTP, context: this.context });
  }

  logWebhook(payload: Omit<WebhookLog, 'type' | 'level' | 'timestamp'>) {
    this.logger.info(payload.message, { ...payload, type: LogType.WEBHOOK, context: this.context });
  }

  logSystem(payload: Omit<SystemLog, 'type' | 'level' | 'timestamp'>) {
    this.logger.info(payload.message, { ...payload, type: LogType.SYSTEM, context: this.context });
  }
}
