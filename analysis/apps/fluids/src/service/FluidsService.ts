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
import { DrivetrainClient } from "../client/DrivetrainClient";
import { MechanicalClient } from "../client/MechanicalClient";

const ANALYSIS_DURATION_MS = 5_000;

@Injectable()
export class FluidsService {
  private readonly cluster = Cluster.FLUIDS;
  private readonly equipments = [
    Equipment.OIL_SYSTEM,
    Equipment.FUEL_SYSTEM,
    Equipment.COOLING_SYSTEM,
  ];

  constructor(
    private kafkaClient: KafkaClient,
    private drivetrainClient: DrivetrainClient,
    private mechanicalClient: MechanicalClient,
  ) {}

  analyze(request: AnalyzeRequest) {
    assertUpstreamCluster(request, [], this.cluster);

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

    const nextAnalyzeRequest = {
      runId: request.runId,
      config: request.config,
      upstreamCluster: this.cluster,
    };

    void this.drivetrainClient.analyze(nextAnalyzeRequest);
    void this.mechanicalClient.analyze(nextAnalyzeRequest);
  }
}
