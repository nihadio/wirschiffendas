import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsObject, IsIn } from "class-validator";
import { CYLINDER_VARIANTS, type CylinderVariant } from "wsd/shared";

export class CreateConfigDto {
  @ApiProperty({
    example: "Diesel Engine 2000 M96",
    description: "Engine model selected for the analysis run.",
  })
  @IsString()
  engineModel!: string;

  @ApiProperty({
    enum: [...CYLINDER_VARIANTS],
    example: "12V",
    description: "Cylinder variant of the selected engine.",
  })
  @IsIn(CYLINDER_VARIANTS)
  cylinderVariant!: CylinderVariant;

  @ApiProperty({
    example: "ZF 2060",
    description: "Gearbox option selected for the engine.",
  })
  @IsString()
  gearboxType!: string;

  @ApiProperty({
    type: "object",
    additionalProperties: true,
    example: {
      oilSystem: { oilReplenishment: true },
      fuelSystem: { leakageMonitoring: true },
      coolingSystem: { tropicalCooling: false },
    },
    description: "Optional equipment configuration stored as JSON.",
  })
  @IsObject()
  equipment!: Record<string, any>;
}
