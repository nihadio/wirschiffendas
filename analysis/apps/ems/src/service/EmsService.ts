import { BadRequestException, Injectable } from "@nestjs/common";
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

const ANALYSIS_DURATION_MS = 5_000;

@Injectable()
export class EmsService {
  private readonly cluster = Cluster.EMS;
  private readonly equipments = [
    Equipment.ENGINE_MANAGEMENT_SYSTEM,
    Equipment.MONITORING_CONTROL_SYSTEM,
  ];

  private readonly runs = new Map<string, EmsRunState>();

  private readonly requiredUpstreamClusters: readonly [Cluster, Cluster] = [
    Cluster.DRIVETRAIN,
    Cluster.MECHANICAL,
  ];

  constructor(private kafkaClient: KafkaClient) {}

  analyze(request: AnalyzeRequest) {
    const upstreamCluster = assertUpstreamCluster(
      request,
      this.requiredUpstreamClusters,
      this.cluster,
    );

    const run = this.runs.get(request.runId) ?? {
      upstreamByCluster: {},
    };

    if (!request.upstreamResults?.length) {
      throw new BadRequestException("EMS requires upstreamResults.");
    }

    run.upstreamByCluster[upstreamCluster] = request.upstreamResults;

    this.runs.set(request.runId, run);

    const hasAllRequiredInputs = this.requiredUpstreamClusters.every(
      (cluster) => run.upstreamByCluster[cluster] !== undefined,
    );

    if (!hasAllRequiredInputs || run.running) {
      return;
    }

    run.running = true;

    const upstreamResults = this.requiredUpstreamClusters.flatMap(
      (cluster) => run.upstreamByCluster[cluster] ?? [],
    );

    void this.run(request.runId, upstreamResults).finally(() => {
      run.running = false;
    });
  }

  private async run(runId: string, upstreamResults: EquipmentResult[]) {
    this.kafkaClient.emitStatus({
      runId,
      cluster: this.cluster,
      status: AlgorithmStatus.RUNNING,
    });

    await new Promise((r) => setTimeout(r, ANALYSIS_DURATION_MS));

    const dependent = upstreamResults.some(
      (result) => result.result === AnalysisResult.FAILED,
    )
      ? AnalysisResult.FAILED
      : AnalysisResult.OK;

    const results: EquipmentResult[] = this.equipments.map((equipment) => ({
      equipment,
      result: dependent,
    }));

    this.kafkaClient.emitResult({
      runId,
      cluster: this.cluster,
      results,
    });

    this.kafkaClient.emitStatus({
      runId,
      cluster: this.cluster,
      status: AlgorithmStatus.READY,
    });
  }
}

type EmsRunState = {
  upstreamByCluster: Partial<Record<Cluster, EquipmentResult[]>>;
  running?: boolean;
};
