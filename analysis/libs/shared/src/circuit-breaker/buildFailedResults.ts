import { AnalysisResult, Cluster, EQUIPMENT_BY_CLUSTER } from "@shared";
import { EquipmentResult } from "../messages";

export function buildFailedResults(cluster: Cluster): EquipmentResult[] {
  return EQUIPMENT_BY_CLUSTER[cluster].map((equipment) => ({
    equipment,
    result: AnalysisResult.FAILED,
  }));
}
