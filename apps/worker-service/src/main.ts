import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app/app.module.ts';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  const port = process.env.PORT || 3004;
  await app.listen(port);

  Logger.log(`🚀 Worker Service is running on: http://localhost:${port}`);
  Logger.log(`📋 Consuming from queues: pdf-export, csv-import`);
}

bootstrap();
