import { Injectable, Inject, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { RabbitMQModuleOptions } from './rabbitmq.config.ts';
import { Job, JobStatus, JobResult } from './rabbitmq.types.ts';
import { QueueName, JobType } from './rabbitmq.queues.ts';

export const RABBITMQ_OPTIONS = 'RABBITMQ_OPTIONS';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private isConnected = false;

  constructor(
    @Inject(RABBITMQ_OPTIONS) private readonly options: RabbitMQModuleOptions,
  ) { }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.close();
  }

  /**
   * Connect to RabbitMQ
   */
  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.options.url);
      this.channel = await this.connection.createChannel();

      // Set prefetch count
      await this.channel.prefetch(this.options.prefetchCount || 1);

      this.isConnected = true;
      this.logger.log('RabbitMQ connected successfully');

      // Handle connection events
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
        this.scheduleReconnect();
      });
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      this.scheduleReconnect();
      throw error;
    }
  }

  private scheduleReconnect(): void {
    const delay = this.options.reconnectDelay || 5000;
    setTimeout(() => {
      this.logger.log('Attempting to reconnect to RabbitMQ...');
      this.connect().catch(() => { });
    }, delay);
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
    }
  }

  /**
   * Health check
   */
  healthCheck(): boolean {
    return this.isConnected && this.channel !== null;
  }

  /**
   * Declare a queue
   */
  async declareQueue(queue: QueueName, durable = true): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    await this.channel.assertQueue(queue, {
      durable,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': `${queue}.dlq`,
      },
    });

    // Also declare dead letter queue
    await this.channel.assertQueue(`${queue}.dlq`, { durable: true });
  }

  /**
   * Publish a job to a queue
   */
  async publish<T>(queue: QueueName, type: JobType, payload: T, options: Partial<Job<T>> = {}): Promise<string> {
    if (!this.channel) throw new Error('Channel not initialized');

    const job: Job<T> = {
      id: options.id || uuidv4(),
      type,
      payload,
      priority: options.priority || 0,
      maxRetries: options.maxRetries || 3,
      retryCount: options.retryCount || 0,
      createdAt: new Date(),
      scheduledAt: options.scheduledAt,
    };

    await this.declareQueue(queue);

    this.channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(job)),
      {
        persistent: true,
        priority: job.priority,
        timestamp: Date.now(),
        contentType: 'application/json',
      },
    );

    this.logger.debug(`Job published to ${queue}`, { jobId: job.id, type: job.type });

    return job.id;
  }

  /**
   * Publish with priority
   */
  async publishWithPriority<T>(
    queue: QueueName,
    type: JobType,
    payload: T,
    priority: number,
  ): Promise<string> {
    return this.publish(queue, type, payload, { priority });
  }

  /**
   * Consume messages from a queue
   */
  async consume<T>(
    queue: QueueName,
    handler: (job: Job<T>) => Promise<JobResult>,
  ): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    await this.declareQueue(queue);

    this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const job: Job<T> = JSON.parse(msg.content.toString());
        this.logger.debug(`Processing job ${job.id} (${job.type})`);

        const result = await handler(job);

        if (result.status === JobStatus.COMPLETED) {
          this.channel!.ack(msg);
          this.logger.debug(`Job ${job.id} completed`);
        } else if (result.status === JobStatus.FAILED) {
          // Check if we should retry
          if (job.retryCount! < job.maxRetries!) {
            // Requeue with incremented retry count
            const retryJob = { ...job, retryCount: job.retryCount! + 1 };
            this.channel!.sendToQueue(
              queue,
              Buffer.from(JSON.stringify(retryJob)),
              { persistent: true },
            );
            this.channel!.ack(msg);
            this.logger.warn(`Job ${job.id} failed, retrying (${retryJob.retryCount}/${job.maxRetries})`);
          } else {
            // Move to DLQ
            this.channel!.nack(msg, false, false);
            this.logger.error(`Job ${job.id} moved to DLQ after ${job.maxRetries} retries`);
          }
        }
      } catch (error) {
        this.logger.error('Error processing message', error);
        this.channel!.nack(msg, false, false);
      }
    });

    this.logger.log(`Started consuming from queue: ${queue}`);
  }

  /**
   * Get queue stats
   */
  async getQueueStats(queue: QueueName): Promise<{ messageCount: number; consumerCount: number }> {
    if (!this.channel) throw new Error('Channel not initialized');

    const { messageCount, consumerCount } = await this.channel.checkQueue(queue);
    return { messageCount, consumerCount };
  }

  /**
   * Purge queue (delete all messages)
   */
  async purgeQueue(queue: QueueName): Promise<number> {
    if (!this.channel) throw new Error('Channel not initialized');

    const { messageCount } = await this.channel.purgeQueue(queue);
    return messageCount;
  }
}
