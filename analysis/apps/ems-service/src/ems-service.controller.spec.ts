import { Test, TestingModule } from '@nestjs/testing';
import { EmsServiceController } from './ems-service.controller';
import { EmsServiceService } from './ems-service.service';

describe('EmsServiceController', () => {
  let emsServiceController: EmsServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EmsServiceController],
      providers: [EmsServiceService],
    }).compile();

    emsServiceController = app.get<EmsServiceController>(EmsServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(emsServiceController.getHello()).toBe('Hello World!');
    });
  });
});
