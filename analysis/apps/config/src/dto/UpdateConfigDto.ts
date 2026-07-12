import { IsIn, IsObject, IsOptional, IsString } from "class-validator";
import { CYLINDER_VARIANTS, type CylinderVariant } from "@shared";

export class UpdateConfigDto {
  @IsOptional()
  @IsString()
  engineModel?: string;

  @IsOptional()
  @IsIn(CYLINDER_VARIANTS)
  cylinderVariant?: CylinderVariant;

  @IsOptional()
  @IsString()
  gearboxType?: string;

  @IsOptional()
  @IsObject()
  equipment?: Record<string, any>;
}
