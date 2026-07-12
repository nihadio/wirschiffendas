import { IsIn, IsObject, IsString } from "class-validator";
import { CYLINDER_VARIANTS, type CylinderVariant } from "./CylinderVariant";

export class OptionalEquipmentConfig {
  @IsString()
  engineModel!: string;

  @IsIn(CYLINDER_VARIANTS)
  cylinderVariant!: CylinderVariant;

  @IsString()
  gearboxType!: string;

  @IsObject()
  equipment!: Record<string, any>;
}
