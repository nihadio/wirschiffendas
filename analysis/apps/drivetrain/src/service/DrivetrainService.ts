import { Inject, Injectable } from "@nestjs/common";
import {
  AlgorithmStatus,
  AnalysisResult,
  AnalyzeRequest,
  Cluster,
  EMS_ANALYZE,
  Equipment,
  EquipmentResult,
  EVENT_PUBLISHER,
  RetryMessage,
  SimulationService,
  type IAnalyze,
  type IEventPublisher,
} from "@shared";

const ANALYSIS_DURATION_MS = 9_000;

@Injectable()
export class DrivetrainService {
  private readonly cluster = Cluster.DRIVETRAIN;
  private readonly equipments = [
    Equipment.POWER_TRANSMISSION,
    Equipment.GEARBOX_OPTIONS,
  ];

  constructor(
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
    @Inject(EMS_ANALYZE) private readonly ems: IAnalyze,
    private simulationService: SimulationService,
  ) {}

  analyze(request: AnalyzeRequest) {
    return this.run(request);
  }

  retry(message: RetryMessage) {
    try {
      this.simulationService.assertUp();
    } catch {
      this.eventPublisher.emitStatus({
        runId: message.runId,
        cluster: this.cluster,
        status: AlgorithmStatus.FAILED,
      });
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

    void this.ems.analyze({
      runId: request.runId,
      source: this.cluster,
    });
  }
}
