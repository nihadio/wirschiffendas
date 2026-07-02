import { Test, TestingModule } from '@nestjs/testing';
import { ConfigServiceController } from './config-service.controller';
import { ConfigServiceService } from './config-service.service';

describe('ConfigServiceController', () => {
  let configServiceController: ConfigServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ConfigServiceController],
      providers: [ConfigServiceService],
    }).compile();

    configServiceController = app.get<ConfigServiceController>(ConfigServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(configServiceController.getHello()).toBe('Hello World!');
    });
  });
});
