import { EquipmentResult } from "../messages";

export const CYLINDER_VARIANTS = ["10V", "12V", "16V"] as const;
export type CylinderVariant = (typeof CYLINDER_VARIANTS)[number];

export interface OptionalEquipmentConfig {
  engineModel: string;
  cylinderVariant: CylinderVariant;
  gearboxType: string;
  equipment: Record<string, any>;
}

export interface AnalyzeRequest {
  runId: string;
  config: OptionalEquipmentConfig;
  upstreamResults?: EquipmentResult[];
}
