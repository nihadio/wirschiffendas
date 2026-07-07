import {
  BadRequestException,
  Injectable,
  Inject,
  OnModuleInit,
} from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import {
  ALGORITHM_DURATION_MS,
  AlgorithmStatus,
  AnalysisResult,
  AnalyzeRequest,
  Cluster,
  EQUIPMENT_BY_CLUSTER,
  EquipmentResult,
  KAFKA_CLIENT,
  KafkaTopics,
} from "@shared";

@Injectable()
export class EmsService implements OnModuleInit {
  private readonly cluster = Cluster.EMS;
  private readonly equipments = EQUIPMENT_BY_CLUSTER[Cluster.EMS];

  private readonly runs = new Map<string, EmsRunState>();

  private readonly requiredUpstreamClusters: readonly Cluster[] = [
    Cluster.DRIVETRAIN,
    Cluster.MECHANICAL,
  ];

  constructor(@Inject(KAFKA_CLIENT) private kafka: ClientKafka) {}

  async onModuleInit() {
    await this.kafka.connect();
  }

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

    run.upstreamByCluster[request.upstreamCluster] =
      request.upstreamResults ?? [];

    this.runs.set(request.runId, run);

    const hasAllRequiredInputs = this.requiredUpstreamClusters.every(
      (cluster) => run.upstreamByCluster[cluster] !== undefined,
    );

    if (!hasAllRequiredInputs || run.running) {
      return;
    }

    // upstream cache is kept after the run so a single retried upstream
    // can re-trigger EMS; unbounded growth is accepted for this PoC
    run.running = true;

    const upstream = this.requiredUpstreamClusters.flatMap(
      (cluster) => run.upstreamByCluster[cluster] ?? [],
    );

    void this.run(request.runId, upstream).finally(() => {
      run.running = false;
    });
  }

  reset(runId: string) {
    this.runs.delete(runId);
  }

  private async run(runId: string, upstream: EquipmentResult[]) {
    this.kafka.emit(KafkaTopics.STATUS, {
      runId,
      cluster: this.cluster,
      status: AlgorithmStatus.RUNNING,
    });

    await new Promise((r) => setTimeout(r, ALGORITHM_DURATION_MS));

    const dependent = upstream.some((r) => r.result === AnalysisResult.FAILED)
      ? AnalysisResult.FAILED
      : AnalysisResult.OK;

    const results: EquipmentResult[] = this.equipments.map((equipment) => ({
      equipment,
      result: dependent,
    }));

    this.kafka.emit(KafkaTopics.RESULT, {
      runId,
      cluster: this.cluster,
      results,
    });

    this.kafka.emit(KafkaTopics.STATUS, {
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
