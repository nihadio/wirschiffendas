import { config as loadEnv } from "dotenv";

loadEnv({ path: "apps/mechanical/.env", quiet: true });

export const ENV = {
  port: Number(process.env.PORT ?? 3004),
  urls: {
    ems: process.env.EMS_URL ?? "http://localhost:3005",
  },
} as const;
