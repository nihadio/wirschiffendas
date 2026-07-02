import { Cluster } from "@shared";
import { EquipmentResult } from "./EquipmentResult";

export interface ResultMessage {
  runId: string;
  cluster: Cluster;
  results: EquipmentResult[];
}
