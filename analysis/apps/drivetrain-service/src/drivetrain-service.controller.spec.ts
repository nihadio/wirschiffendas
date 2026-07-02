import { Test, TestingModule } from '@nestjs/testing';
import { DrivetrainServiceController } from './drivetrain-service.controller';
import { DrivetrainServiceService } from './drivetrain-service.service';

describe('DrivetrainServiceController', () => {
  let drivetrainServiceController: DrivetrainServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DrivetrainServiceController],
      providers: [DrivetrainServiceService],
    }).compile();

    drivetrainServiceController = app.get<DrivetrainServiceController>(DrivetrainServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(drivetrainServiceController.getHello()).toBe('Hello World!');
    });
  });
});
