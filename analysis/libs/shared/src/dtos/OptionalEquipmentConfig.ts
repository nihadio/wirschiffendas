import { CylinderVariant } from "./CylinderVariant";

export interface OptionalEquipmentConfig {
  engineModel: string;
  cylinderVariant: CylinderVariant;
  gearboxType: string;
  equipment: Record<string, any>;
}
