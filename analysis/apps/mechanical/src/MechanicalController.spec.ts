import { Test, TestingModule } from "@nestjs/testing";
import { AnalyzeRequest } from "@shared";
import { MechanicalController } from "./MechanicalController";
import { MechanicalService } from "./MechanicalService";

describe("MechanicalController", () => {
  let mechanicalController: MechanicalController;
  let mechanicalService: { run: jest.Mock };

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
    mechanicalService = {
      run: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [MechanicalController],
      providers: [{ provide: MechanicalService, useValue: mechanicalService }],
    }).compile();

    mechanicalController = app.get<MechanicalController>(MechanicalController);
  });

  describe("analyze", () => {
    it("starts mechanical analysis", () => {
      expect(mechanicalController.analyze(request)).toEqual({
        accepted: true,
        runId: request.runId,
      });
      expect(mechanicalService.run).toHaveBeenCalledWith(request);
    });
  });
});
