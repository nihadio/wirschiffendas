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

  getClusterResults(runId: string, cluster: Cluster) {
    return this.getRun(runId).clusters[cluster]?.results;
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

    // Fresh stream so the retry does not replay the previous run's buffered
    // events — a stale "overall" would close the reconnecting client's SSE.
    run.subject = new ReplaySubject(50);

    // Re-seed the retained clusters so a reconnecting client sees their state.
    for (const retained of this.clusters) {
      const state = run.clusters[retained];

      if (!state) {
        continue;
      }

      if (state.status) {
        run.subject.next({
          type: "status",
          runId,
          cluster: retained,
          status: state.status,
        });
      }

      if (state.results) {
        run.subject.next({
          type: "result",
          runId,
          cluster: retained,
          results: state.results,
        });
      }
    }
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

    this.evaluateOverall(message.runId, run);
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
  }

  private evaluateOverall(runId: string, run: Run) {
    if (run.overallEmitted) {
      return;
    }

    const statuses = this.clusters.map(
      (cluster) => run.clusters[cluster]?.status,
    );

    if (statuses.some((status) => status === AlgorithmStatus.FAILED)) {
      this.emitOverall(runId, run, AnalysisResult.FAILED);
      return;
    }

    if (statuses.every((status) => status === AlgorithmStatus.READY)) {
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
