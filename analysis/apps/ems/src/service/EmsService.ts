import { BadRequestException, Injectable } from "@nestjs/common";
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
  StatusMessage,
} from "@shared";

const ANALYSIS_DURATION_MS = 10_000;

@Injectable()
export class EmsService {
  private readonly cluster = Cluster.EMS;
  private readonly equipments = [
    Equipment.ENGINE_MANAGEMENT_SYSTEM,
    Equipment.MONITORING_CONTROL_SYSTEM,
  ];
  private readonly requiredUpstreams: readonly EmsUpstreamCluster[] = [
    Cluster.DRIVETRAIN,
    Cluster.MECHANICAL,
  ];
  private readonly runs = new Map<string, EmsRunState>();

  constructor(
    private kafkaClient: KafkaClient,
    private simulationService: SimulationService,
  ) {}

  analyze(request: AnalyzeRequest) {
    if (!isEmsUpstreamCluster(request.source)) {
      throw new BadRequestException(
        "EMS requires source from drivetrain or mechanical.",
      );
    }

    const run = this.getRun(request.runId);
    run.readyUpstreams.add(request.source);
    this.startIfReady(request.runId, run);
  }

  handleStatusMessage(message: StatusMessage) {
    if (!isEmsUpstreamCluster(message.cluster)) {
      return;
    }

    const run = this.getRun(message.runId);

    if (message.status === AlgorithmStatus.READY) {
      run.readyUpstreams.add(message.cluster);
      return;
    }

    if (message.status === AlgorithmStatus.FAILED) {
      this.invalidate(run);
      run.readyUpstreams.delete(message.cluster);
      this.emitFailed(message.runId);
    }
  }

  handleRetry(message: RetryMessage) {
    if (message.cluster === Cluster.FLUIDS) {
      this.resetRun(message.runId);
      return;
    }

    if (isEmsUpstreamCluster(message.cluster)) {
      const run = this.getRun(message.runId);
      this.invalidate(run);
      run.readyUpstreams.delete(message.cluster);
      return;
    }

    if (message.cluster !== Cluster.EMS) {
      return;
    }

    try {
      this.simulationService.assertUp();
    } catch {
      this.emitFailed(message.runId);
      return;
    }

    const run = this.getRun(message.runId);
    run.completed = false;

    if (!this.startIfReady(message.runId, run)) {
      this.emitFailed(message.runId);
    }
  }

  private startIfReady(runId: string, run: EmsRunState) {
    if (run.running || run.completed || !this.hasAllUpstreams(run)) {
      return false;
    }

    const version = run.version;
    run.running = true;

    void this.run(runId, run, version).then((completed) => {
      if (run.version !== version) {
        return;
      }

      run.running = false;
      run.completed = completed;
    });

    return true;
  }

  private async run(runId: string, run: EmsRunState, version: number) {
    this.kafkaClient.emitStatus({
      runId,
      cluster: this.cluster,
      status: AlgorithmStatus.RUNNING,
    });

    await new Promise((resolve) => setTimeout(resolve, ANALYSIS_DURATION_MS));

    if (run.version !== version) {
      return false;
    }

    const results: EquipmentResult[] = this.equipments.map((equipment) => ({
      equipment,
      result: AnalysisResult.OK,
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

    return true;
  }

  private hasAllUpstreams(run: EmsRunState) {
    return this.requiredUpstreams.every((cluster) =>
      run.readyUpstreams.has(cluster),
    );
  }

  private getRun(runId: string) {
    const run = this.runs.get(runId) ?? createRunState();
    this.runs.set(runId, run);
    return run;
  }

  private resetRun(runId: string) {
    const run = this.runs.get(runId);

    if (run) {
      this.invalidate(run);
    }

    this.runs.set(runId, createRunState());
  }

  private invalidate(run: EmsRunState) {
    run.version += 1;
    run.running = false;
    run.completed = false;
  }

  private emitFailed(runId: string) {
    this.kafkaClient.emitStatus({
      runId,
      cluster: this.cluster,
      status: AlgorithmStatus.FAILED,
    });
  }
}

type EmsUpstreamCluster = NonNullable<AnalyzeRequest["source"]>;

function isEmsUpstreamCluster(
  cluster: Cluster | undefined,
): cluster is EmsUpstreamCluster {
  return cluster === Cluster.DRIVETRAIN || cluster === Cluster.MECHANICAL;
}

function createRunState(): EmsRunState {
  return {
    readyUpstreams: new Set<EmsUpstreamCluster>(),
    version: 0,
  };
}

type EmsRunState = {
  readyUpstreams: Set<EmsUpstreamCluster>;
  version: number;
  running?: boolean;
  completed?: boolean;
};
