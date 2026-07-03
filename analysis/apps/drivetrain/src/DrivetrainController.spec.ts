import { Test, TestingModule } from "@nestjs/testing";
import { AnalyzeRequest } from "@shared";
import { DrivetrainController } from "./DrivetrainController";
import { DrivetrainService } from "./DrivetrainService";

describe("DrivetrainController", () => {
  let drivetrainController: DrivetrainController;
  let drivetrainService: { run: jest.Mock };

  const request: AnalyzeRequest = {
    runId: "run-1",
    config: {
      engineModel: "Diesel Engine 2000 M96",
      cylinderVariant: "12V",
      gearboxType: "ZF 2060",
      equipment: {},
    },
  };

  beforeEach(async () => {
    drivetrainService = {
      run: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [DrivetrainController],
      providers: [{ provide: DrivetrainService, useValue: drivetrainService }],
    }).compile();

    drivetrainController = app.get<DrivetrainController>(DrivetrainController);
  });

  describe("analyze", () => {
    it("starts drivetrain analysis", () => {
      expect(drivetrainController.analyze(request)).toEqual({
        accepted: true,
        runId: request.runId,
      });
      expect(drivetrainService.run).toHaveBeenCalledWith(request);
    });
  });
});
