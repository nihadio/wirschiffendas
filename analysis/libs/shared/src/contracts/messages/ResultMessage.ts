import type { Cluster } from "../enums";
import { EquipmentResult } from "./EquipmentResult";

export interface ResultMessage {
  runId: string;
  cluster: Cluster;
  results: EquipmentResult[];
}
