import { Test, TestingModule } from "@nestjs/testing";
import { AnalyzeRequest } from "@shared";
import { FluidsController } from "./FluidsController";
import { FluidsService } from "./FluidsService";

describe("FluidsController", () => {
  let fluidsController: FluidsController;
  let fluidsService: { run: jest.Mock };

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
    fluidsService = {
      run: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [FluidsController],
      providers: [{ provide: FluidsService, useValue: fluidsService }],
    }).compile();

    fluidsController = app.get<FluidsController>(FluidsController);
  });

  describe("analyze", () => {
    it("starts fluids analysis", () => {
      expect(fluidsController.analyze(request)).toEqual({
        accepted: true,
        runId: request.runId,
      });
      expect(fluidsService.run).toHaveBeenCalledWith(request);
    });
  });
});
