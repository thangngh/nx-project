import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app/app.module.ts';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  const port = process.env.PORT || 3003;
  await app.listen(port);

  Logger.log(`🚀 File Service is running on: http://localhost:${port}`);
}

bootstrap();
