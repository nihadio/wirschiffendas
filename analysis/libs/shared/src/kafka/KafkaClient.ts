import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import type { ResultMessage } from "../messages/ResultMessage";
import type { RetryMessage } from "../messages/RetryMessage";
import type { StatusMessage } from "../messages/StatusMessage";
import { KafkaTopics } from "./KafkaTopics";

@Injectable()
export class KafkaClient implements OnModuleInit {
  constructor(@Inject("KAFKA") private clientKafka: ClientKafka) {}

  async onModuleInit() {
    await this.clientKafka.connect();
  }

  emitStatus(message: StatusMessage) {
    return this.clientKafka.emit(KafkaTopics.STATUS, message);
  }

  emitResult(message: ResultMessage) {
    return this.clientKafka.emit(KafkaTopics.RESULT, message);
  }

  emitRetry(message: RetryMessage) {
    return this.clientKafka.emit(KafkaTopics.RETRY, message);
  }
}
