import { ReplaySubject } from "rxjs";
import {
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
  private readonly resultClusters = Object.values(Cluster);

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

  resetForRetry(runId: string, cluster: Cluster) {
    const run = this.getRun(runId);

    if (cluster === Cluster.FLUIDS) {
      run.clusters = {};
    } else {
      delete run.clusters[cluster];
      delete run.clusters[Cluster.EMS];
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

    if (run.overallEmitted) {
      return;
    }

    const hasAllResults = this.resultClusters.every(
      (cluster) => run.clusters[cluster]?.results !== undefined,
    );

    if (!hasAllResults) {
      return;
    }

    const allResults = this.resultClusters.flatMap(
      (cluster) => run.clusters[cluster]?.results ?? [],
    );

    const overall = allResults.some(
      (result) => result.result === AnalysisResult.FAILED,
    )
      ? AnalysisResult.FAILED
      : AnalysisResult.OK;

    run.overallEmitted = true;
    run.subject.next({
      type: "overall",
      runId: message.runId,
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
    Record<Cluster, { status?: string; results?: EquipmentResult[] }>
  >;
  config: OptionalEquipmentConfig;
  overallEmitted?: boolean;
};
