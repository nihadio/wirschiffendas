import { Inject, Injectable } from "@nestjs/common";
import {
  AlgorithmStatus,
  AnalysisResult,
  AnalyzeRequest,
  Cluster,
  DRIVETRAIN_ANALYZE,
  Equipment,
  EquipmentResult,
  EVENT_PUBLISHER,
  MECHANICAL_ANALYZE,
  RetryMessage,
  SimulationService,
  type IAnalyze,
  type IEventPublisher,
} from "@shared";

export const ANALYSIS_DURATION_MS = 5_000;

@Injectable()
export class FluidsService {
  private readonly cluster = Cluster.FLUIDS;
  private readonly equipments = [
    Equipment.OIL_SYSTEM,
    Equipment.FUEL_SYSTEM,
    Equipment.COOLING_SYSTEM,
  ];

  constructor(
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
    @Inject(DRIVETRAIN_ANALYZE) private readonly drivetrain: IAnalyze,
    @Inject(MECHANICAL_ANALYZE) private readonly mechanical: IAnalyze,
    private simulationService: SimulationService,
  ) {}

  analyze(request: AnalyzeRequest) {
    return this.run(request);
  }

  retry(message: RetryMessage) {
    try {
      this.simulationService.assertUp();
    } catch {
      this.emitFailedChain(message.runId);
      return;
    }

    void this.analyze({ runId: message.runId });
  }

  private async run(request: AnalyzeRequest) {
    const baseMessage = {
      runId: request.runId,
      cluster: this.cluster,
    };

    this.eventPublisher.emitStatus({
      ...baseMessage,
      status: AlgorithmStatus.RUNNING,
    });

    await new Promise((resolve) => setTimeout(resolve, ANALYSIS_DURATION_MS));

    const results: EquipmentResult[] = this.equipments.map((equipment) => ({
      equipment,
      result: AnalysisResult.OK,
    }));

    this.eventPublisher.emitResult({
      ...baseMessage,
      results,
    });

    this.eventPublisher.emitStatus({
      ...baseMessage,
      status: AlgorithmStatus.READY,
    });

    const nextAnalyzeRequest = { runId: request.runId };

    void this.drivetrain.analyze(nextAnalyzeRequest);
    void this.mechanical.analyze(nextAnalyzeRequest);
  }

  private emitFailedChain(runId: string) {
    [Cluster.FLUIDS, Cluster.DRIVETRAIN, Cluster.MECHANICAL].forEach(
      (cluster) => {
        this.eventPublisher.emitStatus({
          runId,
          cluster,
          status: AlgorithmStatus.FAILED,
        });
      },
    );
  }
}
