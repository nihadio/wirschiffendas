import { config as loadEnv } from "dotenv";

loadEnv({ path: "apps/ems/.env", quiet: true });

export const ENV = {
  port: Number(process.env.PORT ?? 3005),
} as const;
