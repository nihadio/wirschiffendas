import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from './ConfigController';
import { ConfigService } from './ConfigService';

describe('ConfigController', () => {
  let configController: ConfigController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [ConfigService],
    }).compile();

    configController = app.get<ConfigController>(ConfigController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(configController.getHello()).toBe('Hello World!');
    });
  });
});
