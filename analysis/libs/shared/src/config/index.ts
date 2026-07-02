import {
  ClientProviderOptions,
  KafkaOptions,
  Transport,
} from "@nestjs/microservices";

const ports = {
  coordinator: 3000,
  config: 3001,
  fluids: 3002,
  drivetrain: 3003,
  mechanical: 3004,
  ems: 3005,
} as const;

const env = {
  kafkaBroker: process.env.KAFKA_BROKER ?? "localhost:9092",
  configDb: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? "config",
    password: process.env.DB_PASSWORD ?? "config",
    database: process.env.DB_NAME ?? "config",
  },
  urls: {
    config: process.env.CONFIG_URL ?? `http://localhost:${ports.config}`,
    fluids: process.env.FLUIDS_URL ?? `http://localhost:${ports.fluids}`,
    drivetrain:
      process.env.DRIVETRAIN_URL ?? `http://localhost:${ports.drivetrain}`,
    mechanical:
      process.env.MECHANICAL_URL ?? `http://localhost:${ports.mechanical}`,
    ems: process.env.EMS_URL ?? `http://localhost:${ports.ems}`,
  },
} as const;

export const CONFIG = {
  ports,
  env,
};

export const KAFKA_CLIENT = "KAFKA";
export function createKafkaClientProvider(): ClientProviderOptions {
  return { name: KAFKA_CLIENT, ...createKafkaOptions() };
}

export function createKafkaOptions(consumerGroupId?: string): KafkaOptions {
  return {
    transport: Transport.KAFKA,
    options: {
      client: { brokers: [env.kafkaBroker] },
      ...(consumerGroupId ? { consumer: { groupId: consumerGroupId } } : {}),
    },
  };
}
