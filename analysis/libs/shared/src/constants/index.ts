import { ClientProviderOptions, Transport } from "@nestjs/microservices";
import { Cluster, Equipment } from "../enums";

export const TOPICS = {
  STATUS: "analysis-status",
  RESULT: "analysis-result",
} as const;

export const EQUIPMENT_BY_CLUSTER: Record<Cluster, Equipment[]> = {
  [Cluster.FLUIDS]: [
    Equipment.OIL_SYSTEM,
    Equipment.FUEL_SYSTEM,
    Equipment.COOLING_SYSTEM,
  ],
  [Cluster.DRIVETRAIN]: [
    Equipment.POWER_TRANSMISSION,
    Equipment.GEARBOX_OPTIONS,
  ],
  [Cluster.MECHANICAL]: [
    Equipment.STARTING_SYSTEM,
    Equipment.AUXILIARY_PTO,
    Equipment.MOUNTING_SYSTEM,
    Equipment.EXHAUST_SYSTEM,
  ],
  [Cluster.EMS]: [
    Equipment.ENGINE_MANAGEMENT_SYSTEM,
    Equipment.MONITORING_CONTROL_SYSTEM,
  ],
} as const;

export const PORTS = {
  coordinator: 3000,
  config: 3001,
  fluids: 3002,
  drivetrain: 3003,
  mechanical: 3004,
  ems: 3005,
} as const;

export const ENV = {
  kafkaBroker: process.env.KAFKA_BROKER ?? "localhost:9092",
  configDb: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? "config",
    password: process.env.DB_PASSWORD ?? "config",
    database: process.env.DB_NAME ?? "config",
  },
  urls: {
    config: process.env.CONFIG_URL ?? `http://localhost:${PORTS.config}`,
    fluids: process.env.FLUIDS_URL ?? `http://localhost:${PORTS.fluids}`,
    drivetrain:
      process.env.DRIVETRAIN_URL ?? `http://localhost:${PORTS.drivetrain}`,
    mechanical:
      process.env.MECHANICAL_URL ?? `http://localhost:${PORTS.mechanical}`,
    ems: process.env.EMS_URL ?? `http://localhost:${PORTS.ems}`,
  },
} as const;

export const KAFKA_CONFIG: ClientProviderOptions = {
  name: "KAFKA",
  transport: Transport.KAFKA,
  options: {
    client: { brokers: [ENV.kafkaBroker] },
  },
};
