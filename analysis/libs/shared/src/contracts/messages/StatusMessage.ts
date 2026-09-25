import { AlgorithmStatus, Cluster } from "../enums";

export interface StatusMessage {
  runId: string;
  cluster: Cluster;
  status: AlgorithmStatus;
}
