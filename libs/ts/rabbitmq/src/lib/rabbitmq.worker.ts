import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service.ts';
import { Job, JobResult, JobStatus, JobHandler } from './rabbitmq.types.ts';
import { QueueName, JobType } from './rabbitmq.queues.ts';

@Injectable()
export class RabbitMQWorker {
  private readonly logger = new Logger(RabbitMQWorker.name);
  private handlers: Map<JobType, JobHandler> = new Map();

  constructor(private readonly rabbitMQService: RabbitMQService) { }

  /**
   * Register a handler for a job type
   */
  registerHandler<T, R>(type: JobType, handler: JobHandler<T, R>): void {
    this.handlers.set(type, handler as JobHandler);
    this.logger.log(`Handler registered for job type: ${type}`);
  }

  /**
   * Start consuming from a queue
   */
  async startConsuming(queue: QueueName): Promise<void> {
    await this.rabbitMQService.consume(queue, async (job: Job) => {
      const handler = this.handlers.get(job.type);

      if (!handler) {
        this.logger.warn(`No handler found for job type: ${job.type}`);
        return {
          jobId: job.id,
          status: JobStatus.FAILED,
          error: `No handler for job type: ${job.type}`,
          processedAt: new Date(),
        };
      }

      try {
        this.logger.log(`Processing job ${job.id} (${job.type})`);
        const result = await handler(job);
        this.logger.log(`Job ${job.id} completed with status: ${result.status}`);
        return result;
      } catch (error) {
        this.logger.error(`Job ${job.id} failed`, error);
        return {
          jobId: job.id,
          status: JobStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          processedAt: new Date(),
        };
      }
    });

    this.logger.log(`Worker started consuming from queue: ${queue}`);
  }

  /**
   * Create a simple handler wrapper
   */
  static createHandler<T, R>(
    fn: (payload: T, job: Job<T>) => Promise<R>,
  ): JobHandler<T, R> {
    return async (job: Job<T>): Promise<JobResult<R>> => {
      try {
        const result = await fn(job.payload, job);
        return {
          jobId: job.id,
          status: JobStatus.COMPLETED,
          result,
          processedAt: new Date(),
        };
      } catch (error) {
        return {
          jobId: job.id,
          status: JobStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          processedAt: new Date(),
        };
      }
    };
  }
}
