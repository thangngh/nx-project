import { Injectable } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';

export interface QueueOptions {
  connection: {
    host: string;
    port: number;
  };
}

@Injectable()
export class QueueService {
  private queues: Map<string, Queue> = new Map();

  createQueue(name: string, options?: QueueOptions) {
    const queue = new Queue(name, options);
    this.queues.set(name, queue);
    return queue;
  }

  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  async addJob(queueName: string, jobName: string, data: any, options?: any) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    return await queue.add(jobName, data, options);
  }

  createWorker(queueName: string, processor: (job: Job) => Promise<any>, options?: any) {
    return new Worker(queueName, processor, options);
  }
}
