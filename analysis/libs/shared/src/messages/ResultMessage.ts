import { Cluster } from "@shared/enums";
import { EquipmentResult } from "./EquipmentResult";

export interface ResultMessage {
  runId: string;
  cluster: Cluster;
  results: EquipmentResult[];
}
