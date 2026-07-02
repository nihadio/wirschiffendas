import { EquipmentResult } from "../messages";
import { OptionalEquipmentConfig } from "./OptionalEquipmentConfig";

export interface AnalyzeRequest {
  runId: string;
  config: OptionalEquipmentConfig;
  upstreamResults?: EquipmentResult[];
}
