import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export interface SwaggerConfig {
  title?: string;
  description?: string;
  version?: string;
  tag?: string;
  path?: string;
}

export class SwaggerSetup {
  static setup(app: INestApplication, config: SwaggerConfig = {}) {
    const {
      title = 'API Documentation',
      description = 'API description',
      version = '1.0',
      tag = 'api',
      path = 'api/docs',
    } = config;

    const swaggerConfig = new DocumentBuilder()
      .setTitle(title)
      .setDescription(description)
      .setVersion(version)
      .addTag(tag)
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(path, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    return document;
  }
}

export * from '@nestjs/swagger';
