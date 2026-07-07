import { config as loadEnv } from "dotenv";

loadEnv({ path: "apps/fluids/.env", quiet: true });

export const ENV = {
  port: Number(process.env.PORT ?? 3002),
  urls: {
    drivetrain: process.env.DRIVETRAIN_URL ?? "http://localhost:3003",
    mechanical: process.env.MECHANICAL_URL ?? "http://localhost:3004",
  },
} as const;
