export const LogType = {
  HTTP: 'HTTP',
  WEBHOOK: 'WEBHOOK',
  SYSTEM: 'SYSTEM',
  DEBUG: 'DEBUG',
  ERROR: 'ERROR',
} as const;

export type LogType = typeof LogType[keyof typeof LogType];

export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  VERBOSE: 'verbose',
  DEBUG: 'debug',
  SILLY: 'silly',
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];
