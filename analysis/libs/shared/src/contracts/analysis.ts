import type { Observable } from "rxjs";
import type { StartAnalysisRequest } from "./dtos";
import type { Cluster } from "./enums";
import type { SimulationStatus } from "./simulation";

export type AnalysisStarted = { runId: string };

export type RetryAccepted = { accepted: true; runId: string; cluster: Cluster };

export type ClusterSimulationStatus = {
  cluster: Cluster;
  status: SimulationStatus;
};

/** UI-facing entry point of the coordinator. Provided only; the required side is the React UI. */
export interface IAnalysis {
  start(body: StartAnalysisRequest): Promise<AnalysisStarted>;
  retry(runId: string, cluster: string): RetryAccepted;
}

/** SSE projection of a run. */
export interface IStream {
  stream(runId: string): Observable<MessageEvent>;
}

/** Coordinator proxy onto the ISimulation interfaces of all clusters. */
export interface ISimulationProxy {
  getStatuses(): Promise<Record<Cluster, SimulationStatus>>;
  down(cluster: string): Promise<ClusterSimulationStatus>;
  up(cluster: string): Promise<ClusterSimulationStatus>;
}
