import { Cluster, AlgorithmStatus, AnalysisResult } from "../enums";

export interface StatusMessage {
  runId: string;
  cluster: Cluster;
  status: AlgorithmStatus;
}

export interface EquipmentResult {
  equipment: string;
  result: AnalysisResult;
}

export interface ResultMessage {
  runId: string;
  cluster: Cluster;
  results: EquipmentResult[];
}
