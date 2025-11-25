import { Injectable } from '@nestjs/common';
import { HealthCheckService, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    // Implement your database health check logic
    const isHealthy = true; // Replace with actual check
    const result = this.getStatus(key, isHealthy);

    if (isHealthy) {
      return result;
    }
    throw new Error('Database is not healthy');
  }
}

@Injectable()
export class CustomHealthService {
  constructor(
    private health: HealthCheckService,
    private db: DatabaseHealthIndicator
  ) { }

  check() {
    return this.health.check([
      () => this.db.isHealthy('database'),
    ]);
  }
}
