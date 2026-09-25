import { ServiceUnavailableException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  AlgorithmStatus,
  Cluster,
  DRIVETRAIN_ANALYZE,
  EVENT_PUBLISHER,
  MECHANICAL_ANALYZE,
  SimulationService,
  type StatusMessage,
  type IAnalyze,
  type IEventPublisher,
} from "@shared";
import { ANALYSIS_DURATION_MS, FluidsService } from "./FluidsService";

describe("FluidsService", () => {
  let service: FluidsService;
  let drivetrainAnalyze: jest.Mock;
  let mechanicalAnalyze: jest.Mock;
  let emitStatus: jest.Mock<void, [StatusMessage]>;
  let simulation: { assertUp: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers();

    drivetrainAnalyze = jest.fn().mockResolvedValue(undefined);
    mechanicalAnalyze = jest.fn().mockResolvedValue(undefined);
    emitStatus = jest.fn<void, [StatusMessage]>();

    const drivetrain: IAnalyze = { analyze: drivetrainAnalyze };
    const mechanical: IAnalyze = { analyze: mechanicalAnalyze };
    const eventPublisher: IEventPublisher = {
      emitStatus,
      emitResult: jest.fn(),
      emitRetry: jest.fn(),
    };
    simulation = { assertUp: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        FluidsService,
        { provide: DRIVETRAIN_ANALYZE, useValue: drivetrain },
        { provide: MECHANICAL_ANALYZE, useValue: mechanical },
        { provide: EVENT_PUBLISHER, useValue: eventPublisher },
        { provide: SimulationService, useValue: simulation },
      ],
    }).compile();

    service = moduleRef.get(FluidsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls both IAnalyze bindings after the analysis and reports RUNNING then READY", async () => {
    const run = service.analyze({ runId: "run-1" });

    expect(drivetrainAnalyze).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(ANALYSIS_DURATION_MS);
    await run;

    expect(drivetrainAnalyze).toHaveBeenCalledTimes(1);
    expect(drivetrainAnalyze).toHaveBeenCalledWith({ runId: "run-1" });
    expect(mechanicalAnalyze).toHaveBeenCalledTimes(1);
    expect(mechanicalAnalyze).toHaveBeenCalledWith({ runId: "run-1" });
    expect(emitStatus.mock.calls.map(([m]) => m.status)).toEqual([
      AlgorithmStatus.RUNNING,
      AlgorithmStatus.READY,
    ]);
  });

  it("emits FAILED for the chain on retry while simulated down", () => {
    simulation.assertUp.mockImplementation(() => {
      throw new ServiceUnavailableException();
    });

    service.retry({ runId: "run-2", cluster: Cluster.FLUIDS });

    expect(emitStatus.mock.calls.map(([m]) => m)).toEqual([
      {
        runId: "run-2",
        cluster: Cluster.FLUIDS,
        status: AlgorithmStatus.FAILED,
      },
      {
        runId: "run-2",
        cluster: Cluster.DRIVETRAIN,
        status: AlgorithmStatus.FAILED,
      },
      {
        runId: "run-2",
        cluster: Cluster.MECHANICAL,
        status: AlgorithmStatus.FAILED,
      },
    ]);
    expect(drivetrainAnalyze).not.toHaveBeenCalled();
    expect(mechanicalAnalyze).not.toHaveBeenCalled();
  });
});
