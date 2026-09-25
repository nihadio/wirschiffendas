import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import {
  KafkaTopics,
  type IEventPublisher,
  type KafkaTopic,
  type TopicContracts,
} from "../contracts/events";
import type {
  ResultMessage,
  RetryMessage,
  StatusMessage,
} from "../contracts/messages";

@Injectable()
export class KafkaClient implements IEventPublisher, OnModuleInit {
  constructor(@Inject("KAFKA") private clientKafka: ClientKafka) {}

  async onModuleInit() {
    await this.clientKafka.connect();
  }

  emitStatus(message: StatusMessage) {
    return this.publish(KafkaTopics.STATUS, message);
  }

  emitResult(message: ResultMessage) {
    return this.publish(KafkaTopics.RESULT, message);
  }

  emitRetry(message: RetryMessage) {
    return this.publish(KafkaTopics.RETRY, message);
  }

  private publish<T extends KafkaTopic>(topic: T, message: TopicContracts[T]) {
    return this.clientKafka.emit(topic, message);
  }
}
