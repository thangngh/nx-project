import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseHealthIndicator, CustomHealthService } from './health.service.ts';

@Module({
  imports: [TerminusModule],
  providers: [DatabaseHealthIndicator, CustomHealthService],
  exports: [DatabaseHealthIndicator, CustomHealthService, TerminusModule],
})
export class HealthModule { }
