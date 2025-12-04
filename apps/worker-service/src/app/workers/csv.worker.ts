import { Injectable, Logger } from '@nestjs/common';
import { MinioService } from '@nx-project/minio';
import {
  RabbitMQWorker,
  JobTypes,
  Job,
  JobResult,
  JobStatus,
  CSVImportPayload,
} from '@nx-project/rabbitmq';
import * as csv from 'csv-parse';
import { Readable } from 'stream';

interface CSVImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; error: string }>;
  duration: string;
}

@Injectable()
export class CSVWorkerService {
  private readonly logger = new Logger(CSVWorkerService.name);

  constructor(private readonly minioService: MinioService) { }

  registerHandlers(worker: RabbitMQWorker): void {
    worker.registerHandler(
      JobTypes.CSV_IMPORT_PRODUCTS,
      this.importProducts.bind(this),
    );
    worker.registerHandler(
      JobTypes.CSV_IMPORT_USERS,
      this.importUsers.bind(this),
    );
  }

  async importProducts(job: Job<CSVImportPayload>): Promise<JobResult<CSVImportResult>> {
    this.logger.log(`Starting CSV product import: ${job.id}`);
    return this.processCSVImport(job, 'products');
  }

  async importUsers(job: Job<CSVImportPayload>): Promise<JobResult<CSVImportResult>> {
    this.logger.log(`Starting CSV user import: ${job.id}`);
    return this.processCSVImport(job, 'users');
  }

  private async processCSVImport(
    job: Job<CSVImportPayload>,
    type: string,
  ): Promise<JobResult<CSVImportResult>> {
    const startTime = Date.now();
    const { payload } = job;

    try {
      // Download CSV from MinIO
      this.logger.log(`Downloading CSV: ${payload.fileBucket}/${payload.fileKey}`);
      const { stream } = await this.minioService.download(payload.fileBucket, payload.fileKey);

      // Process CSV
      const result = await this.parseCSV(stream, payload.batchSize || 1000);

      const duration = `${Date.now() - startTime}ms`;

      this.logger.log(`CSV ${type} import completed: ${job.id}`, {
        totalRows: result.totalRows,
        successCount: result.successCount,
        errorCount: result.errorCount,
        duration,
      });

      // Upload error report if there are errors
      if (result.errors.length > 0) {
        await this.uploadErrorReport(payload, job.id, result.errors);
      }

      return {
        jobId: job.id,
        status: JobStatus.COMPLETED,
        result: { ...result, duration },
        processedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`CSV ${type} import failed: ${job.id}`, error);
      return {
        jobId: job.id,
        status: JobStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date(),
      };
    }
  }

  private async parseCSV(
    stream: Readable,
    batchSize: number,
  ): Promise<Omit<CSVImportResult, 'duration'>> {
    return new Promise((resolve, reject) => {
      const result = {
        totalRows: 0,
        successCount: 0,
        errorCount: 0,
        errors: [] as Array<{ row: number; error: string }>,
      };

      let isFirstRow = true;
      let headers: string[] = [];

      const parser = csv.parse({
        delimiter: ',',
        skip_empty_lines: true,
        relax_column_count: true,
      });

      parser.on('data', (row: string[]) => {
        if (isFirstRow) {
          headers = row;
          isFirstRow = false;
          return;
        }

        result.totalRows++;

        // Validate row
        if (row.length !== headers.length) {
          result.errors.push({
            row: result.totalRows,
            error: `Expected ${headers.length} columns, got ${row.length}`,
          });
          result.errorCount++;
          return;
        }

        // In real implementation, you would:
        // 1. Map row to object using headers
        // 2. Validate each field
        // 3. Batch insert to database

        result.successCount++;
      });

      parser.on('end', () => resolve(result));
      parser.on('error', reject);

      stream.pipe(parser);
    });
  }

  private async uploadErrorReport(
    payload: CSVImportPayload,
    jobId: string,
    errors: Array<{ row: number; error: string }>,
  ): Promise<void> {
    const errorData = JSON.stringify(errors, null, 2);
    const reportKey = `imports/${payload.userId}/errors_${jobId}.json`;

    try {
      await this.minioService.upload(
        Buffer.from(errorData),
        errorData.length,
        {
          bucket: payload.fileBucket,
          objectName: reportKey,
          contentType: 'application/json',
        },
      );
      this.logger.log(`Error report uploaded: ${reportKey}`);
    } catch (error) {
      this.logger.error('Failed to upload error report', error);
    }
  }
}
