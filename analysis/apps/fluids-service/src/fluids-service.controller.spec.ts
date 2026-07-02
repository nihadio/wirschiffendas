import { Test, TestingModule } from '@nestjs/testing';
import { FluidsServiceController } from './fluids-service.controller';
import { FluidsServiceService } from './fluids-service.service';

describe('FluidsServiceController', () => {
  let fluidsServiceController: FluidsServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FluidsServiceController],
      providers: [FluidsServiceService],
    }).compile();

    fluidsServiceController = app.get<FluidsServiceController>(FluidsServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(fluidsServiceController.getHello()).toBe('Hello World!');
    });
  });
});
