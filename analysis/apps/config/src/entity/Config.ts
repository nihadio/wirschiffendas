import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { type CylinderVariant } from "@shared";

@Entity()
export class Config {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  engineModel!: string;

  @Column()
  cylinderVariant!: CylinderVariant;

  @Column()
  gearboxType!: string;

  @Column({ type: "jsonb" })
  equipment!: Record<string, any>;
}
