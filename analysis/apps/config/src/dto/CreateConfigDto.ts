import { IsString, IsObject, IsIn } from "class-validator";
import { CYLINDER_VARIANTS, type CylinderVariant } from "@shared";

export class CreateConfigDto {
  @IsString()
  engineModel!: string;

  @IsIn(CYLINDER_VARIANTS)
  cylinderVariant!: CylinderVariant;

  @IsString()
  gearboxType!: string;

  @IsObject()
  equipment!: Record<string, any>;
}
