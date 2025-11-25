import { Injectable, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

// CACHE_MANAGER is a token used by @nestjs/cache-manager
export const CACHE_MANAGER = 'CACHE_MANAGER';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    return await this.cacheManager.wrap(key, fn, ttl);
  }
}

// Cache decorator for methods
export function Cacheable(keyPrefix: string, ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService: CacheService = this.cacheService;

      if (!cacheService) {
        console.warn('CacheService not found in class instance');
        return originalMethod.apply(this, args);
      }

      const cacheKey = `${keyPrefix}:${propertyKey}:${JSON.stringify(args)}`;

      return await cacheService.wrap(cacheKey, async () => {
        return await originalMethod.apply(this, args);
      }, ttl);
    };

    return descriptor;
  };
}
