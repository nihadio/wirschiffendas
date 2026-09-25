import { ClientProviderOptions } from "@nestjs/microservices";
import { createKafkaOptions } from "./createKafkaOptions";

export function createKafkaClientProvider(): ClientProviderOptions {
  return { name: "KAFKA", ...createKafkaOptions() };
}
