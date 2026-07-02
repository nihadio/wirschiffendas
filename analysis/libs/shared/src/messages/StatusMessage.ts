import { AlgorithmStatus, Cluster } from "@shared";

export interface StatusMessage {
  runId: string;
  cluster: Cluster;
  status: AlgorithmStatus;
}
