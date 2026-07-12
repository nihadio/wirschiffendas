import { Injectable } from "@nestjs/common";
import {
  AlgorithmStatus,
  AnalysisResult,
  AnalyzeRequest,
  assertUpstreamCluster,
  Cluster,
  Equipment,
  EquipmentResult,
  KafkaClient,
} from "@shared";
import { EmsClient } from "../client/EmsClient";

const ANALYSIS_DURATION_MS = 7_000;

@Injectable()
export class DrivetrainService {
  private readonly cluster = Cluster.DRIVETRAIN;
  private readonly equipments = [
    Equipment.POWER_TRANSMISSION,
    Equipment.GEARBOX_OPTIONS,
  ];

  constructor(
    private kafkaClient: KafkaClient,
    private emsClient: EmsClient,
  ) {}

  analyze(request: AnalyzeRequest) {
    assertUpstreamCluster(request, [Cluster.FLUIDS], this.cluster);

    return this.run(request);
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
      config: request.config,
      upstreamCluster: this.cluster,
      upstreamResults: results,
    });
  }
}
