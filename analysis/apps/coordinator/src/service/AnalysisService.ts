import { ReplaySubject } from "rxjs";
import {
  AlgorithmStatus,
  AnalysisResult,
  Cluster,
  EquipmentResult,
  ResultMessage,
  StatusMessage,
} from "@shared";
import { Injectable, NotFoundException } from "@nestjs/common";

const RETRY_PROJECTION_SCOPE: Record<Cluster, readonly Cluster[]> = {
  [Cluster.FLUIDS]: Object.values(Cluster),
  [Cluster.DRIVETRAIN]: [Cluster.DRIVETRAIN, Cluster.EMS],
  [Cluster.MECHANICAL]: [Cluster.MECHANICAL, Cluster.EMS],
  [Cluster.EMS]: [Cluster.EMS],
};

@Injectable()
export class AnalysisService {
  private runs = new Map<string, Run>();
  private readonly clusters = Object.values(Cluster);

  createRun(runId: string) {
    this.runs.set(runId, {
      subject: new ReplaySubject(50),
      clusters: {},
    });
  }

  stream(runId: string) {
    return this.getRun(runId).subject.asObservable();
  }

  resetProjectionForRetry(runId: string, cluster: Cluster) {
    const run = this.getRun(runId);

    for (const affectedCluster of RETRY_PROJECTION_SCOPE[cluster]) {
      delete run.clusters[affectedCluster];
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

    const hasPendingCluster = statuses.some(
      (status) => status === undefined || status === AlgorithmStatus.RUNNING,
    );

    if (hasPendingCluster) {
      return;
    }

    const overall = statuses.some((status) => status === AlgorithmStatus.FAILED)
      ? AnalysisResult.FAILED
      : AnalysisResult.OK;

    this.emitOverall(runId, run, overall);
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
  overallEmitted?: boolean;
};
