import { LogType } from '../types/log.types.ts';

export interface BaseLog {
  timestamp?: string;
  level?: string;
  type: LogType;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
}

export interface HttpLog extends BaseLog {
  type: typeof LogType.HTTP;
  req: {
    method: string;
    url: string;
    headers?: any;
    body?: any;
    ip?: string;
  };
  res: {
    statusCode: number;
    body?: any;
  };
  duration: number;
}

export interface WebhookLog extends BaseLog {
  type: typeof LogType.WEBHOOK;
  event: string;
  source: string;
  payload: any;
  response?: any;
}

export interface SystemLog extends BaseLog {
  type: typeof LogType.SYSTEM;
  operation: string;
  details?: any;
}
