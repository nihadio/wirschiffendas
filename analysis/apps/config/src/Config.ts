import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { CYLINDER_VARIANTS, type CylinderVariant } from "@shared";

@Entity()
export class Config {
  @ApiProperty({
    example: "4d53075a-6e60-4c1d-8b25-6b680d22d21c",
    format: "uuid",
  })
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ApiProperty({ example: "Diesel Engine 2000 M96" })
  @Column()
  engineModel!: string;

  @ApiProperty({ enum: [...CYLINDER_VARIANTS], example: "12V" })
  @Column()
  cylinderVariant!: CylinderVariant;

  @ApiProperty({ example: "ZF 2060" })
  @Column()
  gearboxType!: string;

  @ApiProperty({
    type: "object",
    additionalProperties: true,
    example: {
      oilSystem: { oilReplenishment: true },
      fuelSystem: { leakageMonitoring: true },
    },
  })
  @Column({ type: "jsonb" })
  equipment!: Record<string, any>;
}
