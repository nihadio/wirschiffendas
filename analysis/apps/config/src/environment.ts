import { config as loadEnv } from "dotenv";

loadEnv({ path: "apps/config/.env", quiet: true });

export const ENV = {
  port: Number(process.env.PORT ?? 3001),
  database: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? "config",
    password: process.env.DB_PASSWORD ?? "config",
    database: process.env.DB_NAME ?? "config",
  },
} as const;
