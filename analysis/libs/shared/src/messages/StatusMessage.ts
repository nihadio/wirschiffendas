import { AlgorithmStatus, Cluster } from "@shared/enums";

export interface StatusMessage {
  runId: string;
  cluster: Cluster;
  status: AlgorithmStatus;
}
