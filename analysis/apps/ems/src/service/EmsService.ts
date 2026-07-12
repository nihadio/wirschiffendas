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
  OptionalEquipmentConfig,
  ResultMessage,
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
    run.config = request.config;

    this.runs.set(request.runId, run);
    this.startWhenReady(request.runId, run);
  }

  rememberUpstreamResults(message: ResultMessage) {
    if (!this.requiredUpstreamClusters.includes(message.cluster)) {
      return;
    }

    const run = this.runs.get(message.runId) ?? {
      upstreamByCluster: {},
    };

    run.upstreamByCluster[message.cluster] = message.results;
    this.runs.set(message.runId, run);
  }

  retry(runId: string, config: OptionalEquipmentConfig) {
    const run = this.runs.get(runId);

    if (!run || !this.hasAllRequiredInputs(run)) {
      throw new BadRequestException(
        "Cannot retry EMS without drivetrain and mechanical results.",
      );
    }

    if (run.running) {
      throw new BadRequestException(`EMS run ${runId} is already running.`);
    }

    run.config = config;
    run.completed = false;
    this.startWhenReady(runId, run);
  }

  private startWhenReady(runId: string, run: EmsRunState) {
    if (
      !run.config ||
      !this.hasAllRequiredInputs(run) ||
      run.running ||
      run.completed
    ) {
      return;
    }

    run.running = true;

    const upstreamResults = this.requiredUpstreamClusters.flatMap(
      (cluster) => run.upstreamByCluster[cluster] ?? [],
    );

    void this.run(runId, upstreamResults)
      .then(() => {
        run.completed = true;
      })
      .finally(() => {
        run.running = false;
      });
  }

  private hasAllRequiredInputs(run: EmsRunState) {
    return this.requiredUpstreamClusters.every(
      (cluster) => run.upstreamByCluster[cluster] !== undefined,
    );
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
  config?: OptionalEquipmentConfig;
  running?: boolean;
  completed?: boolean;
};
