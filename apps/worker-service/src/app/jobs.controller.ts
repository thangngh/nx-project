import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { JobsService, CreateJobDto } from './jobs.service.ts';
import { Queues, PDFExportPayload, CSVImportPayload, QueueName } from '@nx-project/rabbitmq';

@Controller('api/v1/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) { }

  @Post('pdf-export')
  async createPDFExportJob(@Body() payload: PDFExportPayload & { priority?: number }) {
    const { priority, ...exportPayload } = payload;
    return this.jobsService.createPDFExportJob(exportPayload, priority);
  }

  @Post('csv-import')
  async createCSVImportJob(@Body() payload: CSVImportPayload & { priority?: number }) {
    const { priority, ...importPayload } = payload;
    return this.jobsService.createCSVImportJob(importPayload, priority);
  }

  @Get('queues/:queue/stats')
  async getQueueStats(@Param('queue') queue: string) {
    return this.jobsService.getQueueStats(queue as QueueName);
  }

  @Get('queues')
  getQueues() {
    return {
      queues: Object.values(Queues),
    };
  }
}
