import { ModuleMetadata } from '@nestjs/common';

export interface RabbitMQModuleOptions {
  url: string;
  prefetchCount?: number;
  reconnectDelay?: number;
  maxReconnects?: number;
}

export interface RabbitMQModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<RabbitMQModuleOptions> | RabbitMQModuleOptions;
  inject?: any[];
}
