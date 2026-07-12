import { ReplaySubject } from "rxjs";
import {
  AlgorithmStatus,
  AnalysisResult,
  Cluster,
  EquipmentResult,
  OptionalEquipmentConfig,
  ResultMessage,
  StatusMessage,
} from "@shared";
import { Injectable, NotFoundException } from "@nestjs/common";

@Injectable()
export class AnalysisService {
  private runs = new Map<string, Run>();
  private readonly clusters = Object.values(Cluster);

  createRun(runId: string, config: OptionalEquipmentConfig) {
    this.runs.set(runId, {
      subject: new ReplaySubject(50),
      clusters: {},
      config,
    });
  }

  stream(runId: string) {
    return this.getRun(runId).subject.asObservable();
  }

  getConfig(runId: string) {
    return this.getRun(runId).config;
  }

  getClusterStatus(runId: string, cluster: Cluster) {
    return this.getRun(runId).clusters[cluster]?.status;
  }

  resetForRetry(runId: string, cluster: Cluster) {
    const run = this.getRun(runId);

    if (cluster === Cluster.FLUIDS) {
      run.clusters = {};
    } else {
      delete run.clusters[cluster];

      if (cluster !== Cluster.EMS) {
        delete run.clusters[Cluster.EMS];
      }
    }

    run.overallEmitted = false;
  }

  applyStatusMessage(message: StatusMessage) {
    const run = this.runs.get(message.runId);

    if (!run) {
      return;
    }

    run.clusters[message.cluster] = {
      ...run.clusters[message.cluster],
      status: message.status,
    };

    run.subject.next({
      type: "status",
      ...message,
    });

    this.recalculateOverall(message.runId, run);
  }

  applyResultMessage(message: ResultMessage) {
    const run = this.runs.get(message.runId);

    if (!run) {
      return;
    }

    run.clusters[message.cluster] = {
      ...run.clusters[message.cluster],
      results: message.results,
    };

    run.subject.next({
      type: "result",
      ...message,
    });

    this.recalculateOverall(message.runId, run);
  }

  private recalculateOverall(runId: string, run: Run) {
    if (run.overallEmitted) {
      return;
    }

    const hasFailedStatus = this.clusters.some(
      (cluster) => run.clusters[cluster]?.status === AlgorithmStatus.FAILED,
    );
    const hasFailedResult = this.clusters.some((cluster) =>
      run.clusters[cluster]?.results?.some(
        (result) => result.result === AnalysisResult.FAILED,
      ),
    );

    if (hasFailedStatus || hasFailedResult) {
      this.emitOverall(runId, run, AnalysisResult.FAILED);
      return;
    }

    const allReady = this.clusters.every(
      (cluster) => run.clusters[cluster]?.status === AlgorithmStatus.READY,
    );
    const hasAllResults = this.clusters.every(
      (cluster) => run.clusters[cluster]?.results !== undefined,
    );

    if (allReady && hasAllResults) {
      this.emitOverall(runId, run, AnalysisResult.OK);
    }
  }

  private emitOverall(runId: string, run: Run, overall: AnalysisResult) {
    run.overallEmitted = true;
    run.subject.next({
      type: "overall",
      runId,
      overall,
    });
  }

  private getRun(runId: string) {
    const run = this.runs.get(runId);

    if (!run) {
      throw new NotFoundException(`Run ${runId} not found`);
    }

    return run;
  }
}

export type StreamEvent =
  | ({ type: "status" } & StatusMessage)
  | ({ type: "result" } & ResultMessage)
  | { type: "overall"; runId: string; overall: AnalysisResult };

type Run = {
  subject: ReplaySubject<StreamEvent>;
  clusters: Partial<
    Record<Cluster, { status?: AlgorithmStatus; results?: EquipmentResult[] }>
  >;
  config: OptionalEquipmentConfig;
  overallEmitted?: boolean;
};
