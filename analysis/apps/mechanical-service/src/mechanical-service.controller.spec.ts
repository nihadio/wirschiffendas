import { Test, TestingModule } from '@nestjs/testing';
import { MechanicalServiceController } from './mechanical-service.controller';
import { MechanicalServiceService } from './mechanical-service.service';

describe('MechanicalServiceController', () => {
  let mechanicalServiceController: MechanicalServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MechanicalServiceController],
      providers: [MechanicalServiceService],
    }).compile();

    mechanicalServiceController = app.get<MechanicalServiceController>(MechanicalServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mechanicalServiceController.getHello()).toBe('Hello World!');
    });
  });
});
