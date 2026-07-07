import { KafkaOptions, Transport } from "@nestjs/microservices";

export function createKafkaOptions(consumerGroupId?: string): KafkaOptions {
  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKER ?? "localhost:9092"],
      },
      ...(consumerGroupId ? { consumer: { groupId: consumerGroupId } } : {}),
    },
  };
}
