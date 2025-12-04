import { Controller, Get } from '@nestjs/common';
import { MinioService } from '@nx-project/minio';

@Controller('health')
export class HealthController {
  constructor(private readonly minioService: MinioService) { }

  @Get()
  async health() {
    const services: Record<string, string> = {};
    let status = 'healthy';

    // Check MinIO
    const minioHealthy = await this.minioService.healthCheck();
    services['minio'] = minioHealthy ? 'healthy' : 'unhealthy';
    if (!minioHealthy) status = 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      services,
    };
  }

  @Get('ready')
  async ready() {
    const minioHealthy = await this.minioService.healthCheck();

    if (!minioHealthy) {
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
