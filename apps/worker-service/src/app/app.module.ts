import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MinioModule } from '@nx-project/minio';
import { RabbitMQModule, RabbitMQWorker, Queues } from '@nx-project/rabbitmq';
import { PDFWorkerService } from './workers/pdf.worker.ts';
import { CSVWorkerService } from './workers/csv.worker.ts';
import { HealthController } from './health.controller.ts';
import { JobsController } from './jobs.controller.ts';
import { JobsService } from './jobs.service.ts';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    MinioModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        endPoint: configService.get('MINIO_ENDPOINT', 'localhost'),
        port: configService.get('MINIO_PORT', 9000),
        useSSL: configService.get('MINIO_USE_SSL', 'false') === 'true',
        accessKey: configService.get('MINIO_ACCESS_KEY', 'admin'),
        secretKey: configService.get('MINIO_SECRET_KEY', '123456789'),
        defaultBucket: configService.get('MINIO_OUTPUT_BUCKET', 'exports'),
      }),
      inject: [ConfigService],
    }),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        url: configService.get('RABBITMQ_URL', 'amqp://admin:admin123@localhost:5672'),
        prefetchCount: configService.get('WORKER_CONCURRENCY', 5),
        reconnectDelay: 5000,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [HealthController, JobsController],
  providers: [PDFWorkerService, CSVWorkerService, JobsService],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly rabbitMQWorker: RabbitMQWorker,
    private readonly pdfWorker: PDFWorkerService,
    private readonly csvWorker: CSVWorkerService,
  ) { }

  async onModuleInit() {
    // Register PDF handlers
    this.pdfWorker.registerHandlers(this.rabbitMQWorker);

    // Register CSV handlers
    this.csvWorker.registerHandlers(this.rabbitMQWorker);

    // Start consuming
    await this.rabbitMQWorker.startConsuming(Queues.PDF_EXPORT);
    await this.rabbitMQWorker.startConsuming(Queues.CSV_IMPORT);
  }
}
