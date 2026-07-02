import { EquipmentResult } from "../messages";

export interface OptionalEquipmentConfig {
  engineModel: string;
  cylinderVariant: "10V" | "12V" | "16V";
  gearboxType: string;
  equipment: Record<string, any>;
}

export interface AnalyzeRequest {
  runId: string;
  config: OptionalEquipmentConfig;
  upstreamResults?: EquipmentResult[];
}
