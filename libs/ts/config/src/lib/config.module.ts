import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './configs/app.config';
import environmentConfig from './configs/environment.config';
import jwtConfig from './configs/jwt.config';
import corsConfig from './configs/cors.config';
import rateLimitConfig from './configs/rate-limit.config';
import loggerConfig from './configs/logger.config';
import uploadConfig from './configs/upload.config';

@Module({
  imports: [ConfigModule.forRoot({
    load: [
      appConfig,
      environmentConfig,
      jwtConfig,
      corsConfig,
      rateLimitConfig,
      loggerConfig,
      uploadConfig,
    ],
    cache: true,
    isGlobal: true,
  })],
  controllers: [],
  providers: [],
  exports: [],
})
export class NxProjectNestConfigModule { }
