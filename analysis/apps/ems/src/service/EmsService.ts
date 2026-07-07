import { BadRequestException, Injectable } from "@nestjs/common";
import {
  AlgorithmStatus,
  AnalysisResult,
  AnalyzeRequest,
  Cluster,
  Equipment,
  EquipmentResult,
  KafkaClient,
} from "@shared";

const ANALYSIS_DURATION_MS = 7_000;

@Injectable()
export class EmsService {
  private readonly cluster = Cluster.EMS;
  private readonly equipments = [
    Equipment.ENGINE_MANAGEMENT_SYSTEM,
    Equipment.MONITORING_CONTROL_SYSTEM,
  ];

  private readonly runs = new Map<string, EmsRunState>();

  private readonly requiredUpstreamClusters: readonly Cluster[] = [
    Cluster.DRIVETRAIN,
    Cluster.MECHANICAL,
  ];

  constructor(private kafkaClient: KafkaClient) {}

  collect(request: AnalyzeRequest) {
    if (
      !request.upstreamCluster ||
      !this.requiredUpstreamClusters.includes(request.upstreamCluster)
    ) {
      throw new BadRequestException(
        "EMS requires upstreamCluster from drivetrain or mechanical.",
      );
    }

    const run = this.runs.get(request.runId) ?? {
      upstreamByCluster: {},
    };

    run.upstreamByCluster[request.upstreamCluster] = {
      results: request.upstreamResults ?? [],
      failed: request.upstreamFailed ?? false,
    };

    this.runs.set(request.runId, run);

    const hasAllRequiredInputs = this.requiredUpstreamClusters.every(
      (cluster) => run.upstreamByCluster[cluster] !== undefined,
    );

    if (!hasAllRequiredInputs || run.running) {
      return;
    }

    run.running = true;

    const upstreams = this.requiredUpstreamClusters.map(
      (cluster) => run.upstreamByCluster[cluster]!,
    );

    void this.run(request.runId, upstreams).finally(() => {
      run.running = false;
    });
  }

  reset(runId: string) {
    this.runs.delete(runId);
  }

  private async run(runId: string, upstreams: UpstreamInput[]) {
    this.kafkaClient.emitStatus({
      runId,
      cluster: this.cluster,
      status: AlgorithmStatus.RUNNING,
    });

    await new Promise((r) => setTimeout(r, ANALYSIS_DURATION_MS));

    const dependent = upstreams.some(
      (upstream) =>
        upstream.failed ||
        upstream.results.some((r) => r.result === AnalysisResult.FAILED),
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

type UpstreamInput = {
  results: EquipmentResult[];
  failed: boolean;
};

type EmsRunState = {
  upstreamByCluster: Partial<Record<Cluster, UpstreamInput>>;
  running?: boolean;
};
