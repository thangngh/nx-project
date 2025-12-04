import { Injectable, Logger } from '@nestjs/common';
import {
  RabbitMQService,
  Queues,
  JobTypes,
  PDFExportPayload,
  CSVImportPayload,
  QueueName,
  JobType,
} from '@nx-project/rabbitmq';

export interface CreateJobDto {
  type: JobType;
  payload: Record<string, any>;
  priority?: number;
}

export interface JobCreatedResponse {
  jobId: string;
  queue: QueueName;
  type: JobType;
  status: string;
  createdAt: Date;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(private readonly rabbitMQService: RabbitMQService) { }

  async createPDFExportJob(payload: PDFExportPayload, priority = 0): Promise<JobCreatedResponse> {
    const jobId = await this.rabbitMQService.publish(
      Queues.PDF_EXPORT,
      JobTypes.PDF_EXPORT_INVOICES,
      payload,
      { priority },
    );

    this.logger.log(`PDF export job created: ${jobId}`);

    return {
      jobId,
      queue: Queues.PDF_EXPORT,
      type: JobTypes.PDF_EXPORT_INVOICES,
      status: 'PENDING',
      createdAt: new Date(),
    };
  }

  async createCSVImportJob(payload: CSVImportPayload, priority = 0): Promise<JobCreatedResponse> {
    const jobId = await this.rabbitMQService.publish(
      Queues.CSV_IMPORT,
      JobTypes.CSV_IMPORT_PRODUCTS,
      payload,
      { priority },
    );

    this.logger.log(`CSV import job created: ${jobId}`);

    return {
      jobId,
      queue: Queues.CSV_IMPORT,
      type: JobTypes.CSV_IMPORT_PRODUCTS,
      status: 'PENDING',
      createdAt: new Date(),
    };
  }

  async getQueueStats(queue: QueueName) {
    return this.rabbitMQService.getQueueStats(queue);
  }
}
