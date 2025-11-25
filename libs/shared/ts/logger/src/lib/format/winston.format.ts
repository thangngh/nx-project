import { format } from 'winston';

export const customFormat = format.printf(({ timestamp, level, message, context, ...meta }) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    context,
    ...meta,
  });
});

export const prettyFormat = format.printf(({ timestamp, level, message, context, ...meta }) => {
  const contextStr = context ? `[${context}] ` : '';
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${timestamp} ${level}: ${contextStr}${message} ${metaStr}`;
});
