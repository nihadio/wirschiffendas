import { Test, TestingModule } from "@nestjs/testing";
import { AnalyzeRequest, Cluster } from "@shared";
import { EmsController } from "./EmsController";
import { EmsService } from "./EmsService";

describe("EmsController", () => {
  let emsController: EmsController;
  let emsService: { collect: jest.Mock };

  const request: AnalyzeRequest = {
    runId: "run-1",
    config: {
      engineModel: "Diesel Engine 2000 M96",
      cylinderVariant: "12V",
      gearboxType: "ZF 2060",
      equipment: {},
    },
    upstreamCluster: Cluster.DRIVETRAIN,
    upstreamResults: [],
  };

  beforeEach(async () => {
    emsService = {
      collect: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [EmsController],
      providers: [{ provide: EmsService, useValue: emsService }],
    }).compile();

    emsController = app.get<EmsController>(EmsController);
  });

  describe("analyze", () => {
    it("accepts upstream results", () => {
      expect(emsController.analyze(request)).toEqual({
        accepted: true,
        runId: request.runId,
      });
      expect(emsService.collect).toHaveBeenCalledWith(request);
    });
  });
});
