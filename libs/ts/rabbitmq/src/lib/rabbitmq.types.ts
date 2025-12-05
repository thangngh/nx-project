import { JobType } from './rabbitmq.queues.ts';

export const JobStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  RETRYING: 'RETRYING',
} as const;

export type JobStatus = typeof JobStatus[keyof typeof JobStatus];

export interface Job<T = Record<string, any>> {
  id: string;
  type: JobType;
  payload: T;
  priority?: number;
  maxRetries?: number;
  retryCount?: number;
  createdAt: Date;
  scheduledAt?: Date;
}

export interface JobResult<T = any> {
  jobId: string;
  status: JobStatus;
  result?: T;
  error?: string;
  processedAt: Date;
}

// Payload types
export interface PDFExportPayload {
  userId: string;
  invoiceIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  outputBucket: string;
  callbackUrl?: string;
}

export interface CSVImportPayload {
  userId: string;
  fileBucket: string;
  fileKey: string;
  targetTable: string;
  batchSize?: number;
  callbackUrl?: string;
}

export interface EmailSendPayload {
  to: string[];
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: string[];
}

export interface ReportPayload {
  userId: string;
  reportType: string;
  parameters: Record<string, any>;
  outputFormat: 'pdf' | 'excel' | 'csv';
  outputBucket: string;
}

export interface NotifyPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

// Job handler type
export type JobHandler<T = Record<string, any>, R = any> = (
  job: Job<T>,
) => Promise<JobResult<R>>;
