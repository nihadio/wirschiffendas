import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Config {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column() engineModel!: string;
  @Column() cylinderVariant!: string;
  @Column() gearboxType!: string;
  @Column({ type: "jsonb" }) equipment!: Record<string, any>;
}
