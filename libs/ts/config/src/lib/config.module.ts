import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './configs/app.config';
import environmentConfig from './configs/environment.config';

@Module({
  imports: [ConfigModule.forRoot({
    load: [appConfig, environmentConfig],
    cache: true,
    isGlobal: true,
  })],
  controllers: [],
  providers: [],
  exports: [],
})
export class NxProjectNestConfigModule {}
