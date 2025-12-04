import { Injectable, Logger } from '@nestjs/common';
import { MinioService } from '@nx-project/minio';
import {
  RabbitMQWorker,
  JobTypes,
  Job,
  JobResult,
  JobStatus,
  PDFExportPayload,
  ReportPayload,
} from '@nx-project/rabbitmq';

@Injectable()
export class PDFWorkerService {
  private readonly logger = new Logger(PDFWorkerService.name);

  constructor(private readonly minioService: MinioService) { }

  registerHandlers(worker: RabbitMQWorker): void {
    worker.registerHandler(
      JobTypes.PDF_EXPORT_INVOICES,
      this.exportInvoices.bind(this),
    );
    worker.registerHandler(
      JobTypes.PDF_EXPORT_REPORT,
      this.exportReport.bind(this),
    );
  }

  async exportInvoices(job: Job<PDFExportPayload>): Promise<JobResult> {
    this.logger.log(`Starting invoice PDF export: ${job.id}`);
    const { payload } = job;

    try {
      // Simulate processing
      this.logger.log(`Processing ${payload.invoiceIds?.length || 0} invoices for user ${payload.userId}`);

      // In real implementation:
      // 1. Query invoices from database
      // 2. Generate PDF using pdfkit or puppeteer
      // 3. Merge into ZIP if multiple
      // 4. Upload to MinIO

      // Simulate work
      await this.delay(2000);

      // Create sample output
      const outputData = JSON.stringify({
        jobId: job.id,
        userId: payload.userId,
        invoiceCount: payload.invoiceIds?.length || 0,
        generatedAt: new Date().toISOString(),
      });

      const outputKey = `exports/${payload.userId}/invoices_${job.id}.json`;

      await this.minioService.upload(
        Buffer.from(outputData),
        outputData.length,
        {
          bucket: payload.outputBucket || 'exports',
          objectName: outputKey,
          contentType: 'application/json',
        },
      );

      this.logger.log(`Invoice PDF export completed: ${job.id}`);

      return {
        jobId: job.id,
        status: JobStatus.COMPLETED,
        result: {
          bucket: payload.outputBucket || 'exports',
          key: outputKey,
          invoiceCount: payload.invoiceIds?.length || 0,
        },
        processedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Invoice PDF export failed: ${job.id}`, error);
      return {
        jobId: job.id,
        status: JobStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date(),
      };
    }
  }

  async exportReport(job: Job<ReportPayload>): Promise<JobResult> {
    this.logger.log(`Starting report PDF export: ${job.id}`);
    const { payload } = job;

    try {
      this.logger.log(`Generating ${payload.reportType} report for user ${payload.userId}`);

      // Simulate work
      await this.delay(3000);

      // Create sample output
      const outputData = JSON.stringify({
        jobId: job.id,
        reportType: payload.reportType,
        generatedAt: new Date().toISOString(),
      });

      const outputKey = `exports/${payload.userId}/report_${payload.reportType}_${job.id}.json`;

      await this.minioService.upload(
        Buffer.from(outputData),
        outputData.length,
        {
          bucket: payload.outputBucket || 'exports',
          objectName: outputKey,
          contentType: 'application/json',
        },
      );

      this.logger.log(`Report PDF export completed: ${job.id}`);

      return {
        jobId: job.id,
        status: JobStatus.COMPLETED,
        result: {
          bucket: payload.outputBucket || 'exports',
          key: outputKey,
          reportType: payload.reportType,
        },
        processedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Report PDF export failed: ${job.id}`, error);
      return {
        jobId: job.id,
        status: JobStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date(),
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
