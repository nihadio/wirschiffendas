import type { Cluster } from "../enums";

export interface RetryMessage {
  runId: string;
  cluster: Cluster;
}
