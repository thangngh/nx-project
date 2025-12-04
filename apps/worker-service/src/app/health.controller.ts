import { Controller, Get } from '@nestjs/common';
import { MinioService } from '@nx-project/minio';
import { RabbitMQService } from '@nx-project/rabbitmq';

@Controller('health')
export class HealthController {
  constructor(
    private readonly minioService: MinioService,
    private readonly rabbitMQService: RabbitMQService,
  ) { }

  @Get()
  async health() {
    const services: Record<string, string> = {};
    let status = 'healthy';

    // Check MinIO
    const minioHealthy = await this.minioService.healthCheck();
    services['minio'] = minioHealthy ? 'healthy' : 'unhealthy';
    if (!minioHealthy) status = 'unhealthy';

    // Check RabbitMQ
    const rabbitHealthy = this.rabbitMQService.healthCheck();
    services['rabbitmq'] = rabbitHealthy ? 'healthy' : 'unhealthy';
    if (!rabbitHealthy) status = 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      services,
    };
  }

  @Get('ready')
  async ready() {
    const minioHealthy = await this.minioService.healthCheck();
    const rabbitHealthy = this.rabbitMQService.healthCheck();

    if (!minioHealthy || !rabbitHealthy) {
      return {
        status: 'not ready',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
