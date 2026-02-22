import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottleModule } from './throttle.module';
import { RedisService } from '@redis/redis.service';

describe('ThrottleModule', () => {
  let module: TestingModule;
  const mockRedisClient = {};

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ThrottleModule],
    })
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should resolve ThrottlerStorage', () => {
    const storage = module.get<ThrottlerStorage>(ThrottlerStorage);
    expect(storage).toBeDefined();
  });

  it('should call RedisService.getClient() during initialization', () => {
    expect(mockRedisService.getClient).toHaveBeenCalled();
  });
});
