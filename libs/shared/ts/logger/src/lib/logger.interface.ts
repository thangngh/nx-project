/**
 * Extended Log Types for Enterprise Applications
 */

// Step logging
export interface StepLog {
  stepId: string;
  stepName: string;
  phase: 'begin' | 'progress' | 'complete' | 'failed';
  duration?: number;
  progress?: number; // 0-100
  metadata?: Record<string, any>;
}

// HTTP Request/Response
export interface HttpRequestLog {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, any>;
  params?: Record<string, any>;
  userId?: string;
  traceId?: string;
  spanId?: string;
}

export interface HttpResponseLog {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  responseSize?: number;
  traceId?: string;
  spanId?: string;
}

// Retry logging
export interface RetryLog {
  operation: string;
  attempt: number;
  maxRetries: number;
  error?: string;
  nextRetryIn?: number; // milliseconds
  backoffStrategy?: 'linear' | 'exponential' | 'custom';
}

// Exception logging
export interface ExceptionLog {
  exceptionType: string;
  message: string;
  stack?: string;
  context?: string;
  userId?: string;
  traceId?: string;
  metadata?: Record<string, any>;
  handled?: boolean;
}

// Webhook logging
export interface WebhookLog {
  direction: 'incoming' | 'outgoing';
  webhookId?: string;
  source?: string;
  destination?: string;
  event: string;
  payload?: any;
  headers?: Record<string, string>;
  statusCode?: number;
  duration?: number;
  signature?: string;
  verified?: boolean;
}

// WebSocket logging
export interface WebSocketLog {
  event: 'connect' | 'disconnect' | 'message' | 'error' | 'ping' | 'pong';
  socketId: string;
  userId?: string;
  room?: string;
  messageType?: string;
  payload?: any;
  error?: string;
  duration?: number;
}

// Database query logging
export interface DatabaseLog {
  operation: 'query' | 'insert' | 'update' | 'delete' | 'transaction';
  table?: string;
  query?: string;
  params?: any[];
  duration: number;
  rowsAffected?: number;
  error?: string;
}

// Cache logging
export interface CacheLog {
  operation: 'get' | 'set' | 'delete' | 'clear' | 'hit' | 'miss';
  key: string;
  ttl?: number;
  size?: number;
  hit?: boolean;
  duration?: number;
}

// Queue/Job logging
export interface QueueLog {
  queue: string;
  jobId: string;
  jobType: string;
  operation: 'enqueue' | 'dequeue' | 'process' | 'complete' | 'failed' | 'retry';
  attempt?: number;
  maxAttempts?: number;
  duration?: number;
  error?: string;
  priority?: number;
  delay?: number;
}

// External API call
export interface ExternalApiLog {
  service: string;
  endpoint: string;
  method: string;
  requestId?: string;
  duration: number;
  statusCode?: number;
  error?: string;
  retries?: number;
  cached?: boolean;
}

// Authentication/Authorization
export interface AuthLog {
  event: 'login' | 'logout' | 'register' | 'passwordReset' | 'tokenRefresh' | 'permissionCheck';
  userId?: string;
  email?: string;
  success: boolean;
  reason?: string;
  ip?: string;
  userAgent?: string;
  mfa?: boolean;
}

// File operations
export interface FileOperationLog {
  operation: 'upload' | 'download' | 'delete' | 'move' | 'copy';
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number;
  destination?: string;
  userId?: string;
  error?: string;
}

// Payment/Transaction
export interface PaymentLog {
  transactionId: string;
  operation: 'charge' | 'refund' | 'capture' | 'void';
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'success' | 'failed' | 'pending';
  provider?: string;
  userId?: string;
  error?: string;
}

// Base log metadata
export interface LogMetadata {
  trace_id?: string;
  span_id?: string;
  parent_span_id?: string;
  request_id?: string;
  user_id?: string;
  session_id?: string;
  correlation_id?: string;
  environment?: string;
  service?: string;
  version?: string;
  [key: string]: any;
}

// Log entry (existing but extended)
export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'http' | 'debug' | 'verbose';
  message: string;
  context?: string;
  trace?: string;
  metadata?: LogMetadata;
}
