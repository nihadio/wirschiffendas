import { config as loadEnv } from "dotenv";
import { Cluster } from "@shared";

loadEnv({ path: "apps/coordinator/.env", quiet: true });

export const ENV = {
  port: Number(process.env.PORT ?? 3000),
  urls: {
    config: process.env.CONFIG_URL ?? "http://localhost:3001",
    fluids: process.env.FLUIDS_URL ?? "http://localhost:3002",
    drivetrain: process.env.DRIVETRAIN_URL ?? "http://localhost:3003",
    mechanical: process.env.MECHANICAL_URL ?? "http://localhost:3004",
    ems: process.env.EMS_URL ?? "http://localhost:3005",
  } as Record<Cluster | "config", string>,
} as const;
