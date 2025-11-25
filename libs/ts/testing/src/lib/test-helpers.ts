import { Test, TestingModule } from '@nestjs/testing';

export class TestHelpers {
  static async createTestingModule(metadata: any): Promise<TestingModule> {
    return await Test.createTestingModule(metadata).compile();
  }

  static mockRepository<T = any>() {
    return {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    };
  }

  static mockService<T = any>(methods: string[]) {
    const mock: any = {};
    methods.forEach(method => {
      mock[method] = jest.fn();
    });
    return mock as T;
  }
}

export function createMock<T>(type: new (...args: any[]) => T): jest.Mocked<T> {
  const mock: any = {};
  const prototype = type.prototype;

  Object.getOwnPropertyNames(prototype).forEach(key => {
    if (key !== 'constructor') {
      mock[key] = jest.fn();
    }
  });

  return mock;
}
