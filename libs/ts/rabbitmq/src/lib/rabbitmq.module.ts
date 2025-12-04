import { Module, DynamicModule, Global } from '@nestjs/common';
import { RabbitMQService, RABBITMQ_OPTIONS } from './rabbitmq.service.ts';
import { RabbitMQWorker } from './rabbitmq.worker.ts';
import { RabbitMQModuleOptions, RabbitMQModuleAsyncOptions } from './rabbitmq.config.ts';

@Global()
@Module({})
export class RabbitMQModule {
  static forRoot(options: RabbitMQModuleOptions): DynamicModule {
    return {
      module: RabbitMQModule,
      providers: [
        {
          provide: RABBITMQ_OPTIONS,
          useValue: options,
        },
        RabbitMQService,
        RabbitMQWorker,
      ],
      exports: [RabbitMQService, RabbitMQWorker],
    };
  }

  static forRootAsync(options: RabbitMQModuleAsyncOptions): DynamicModule {
    return {
      module: RabbitMQModule,
      imports: options.imports || [],
      providers: [
        {
          provide: RABBITMQ_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        RabbitMQService,
        RabbitMQWorker,
      ],
      exports: [RabbitMQService, RabbitMQWorker],
    };
  }
}
