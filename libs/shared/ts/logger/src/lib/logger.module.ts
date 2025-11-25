import { DynamicModule, Global, Module } from '@nestjs/common';
import { LoggerService, LoggerConfig } from './logger.service.ts';

@Global()
@Module({})
export class LoggerModule {
  static forRoot(config: LoggerConfig): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        {
          provide: LoggerService,
          useValue: new LoggerService(config),
        },
      ],
      exports: [LoggerService],
    };
  }
}
