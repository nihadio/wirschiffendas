import { Injectable } from "@nestjs/common";
import {
  AlgorithmStatus,
  AnalysisResult,
  AnalyzeRequest,
  Cluster,
  Equipment,
  EquipmentResult,
  KafkaClient,
  RetryMessage,
  SimulationService,
} from "@shared";
import { EmsClient } from "../client/EmsClient";

const ANALYSIS_DURATION_MS = 6_000;

@Injectable()
export class MechanicalService {
  private readonly cluster = Cluster.MECHANICAL;
  private readonly equipments = [
    Equipment.STARTING_SYSTEM,
    Equipment.AUXILIARY_PTO,
    Equipment.MOUNTING_SYSTEM,
    Equipment.EXHAUST_SYSTEM,
  ];

  constructor(
    private kafkaClient: KafkaClient,
    private emsClient: EmsClient,
    private simulationService: SimulationService,
  ) {}

  analyze(request: AnalyzeRequest) {
    return this.run(request);
  }

  retry(message: RetryMessage) {
    try {
      this.simulationService.assertUp();
    } catch {
      this.kafkaClient.emitStatus({
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

    this.kafkaClient.emitStatus({
      ...baseMessage,
      status: AlgorithmStatus.RUNNING,
    });

    await new Promise((resolve) => setTimeout(resolve, ANALYSIS_DURATION_MS));

    const results: EquipmentResult[] = this.equipments.map((equipment) => ({
      equipment,
      result: AnalysisResult.OK,
    }));

    this.kafkaClient.emitResult({
      ...baseMessage,
      results,
    });

    this.kafkaClient.emitStatus({
      ...baseMessage,
      status: AlgorithmStatus.READY,
    });

    void this.emsClient.analyze({
      runId: request.runId,
      source: this.cluster,
    });
  }
}
