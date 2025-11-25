import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service.ts';

@Global()
@Module({
  imports: [
    NestCacheModule.register({
      ttl: 5000, // default TTL in milliseconds
      max: 100, // maximum number of items in cache
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule { }
