import { config as loadEnv } from "dotenv";

loadEnv({ path: "apps/drivetrain/.env", quiet: true });

export const ENV = {
  port: Number(process.env.PORT ?? 3003),
  urls: {
    ems: process.env.EMS_URL ?? "http://localhost:3005",
  },
} as const;
