import { Test, TestingModule } from '@nestjs/testing';
import { DrivetrainController } from './DrivetrainController';
import { DrivetrainService } from './DrivetrainService';

describe('DrivetrainController', () => {
  let drivetrainController: DrivetrainController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DrivetrainController],
      providers: [DrivetrainService],
    }).compile();

    drivetrainController = app.get<DrivetrainController>(DrivetrainController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(drivetrainController.getHello()).toBe('Hello World!');
    });
  });
});
