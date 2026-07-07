import { AlgorithmStatus, Cluster } from "../enums";

export type FailureReason = "blocked";

export interface StatusMessage {
  runId: string;
  cluster: Cluster;
  status: AlgorithmStatus;
  reason?: FailureReason;
}
