import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import {
  Cluster,
  type IRetryCommands,
  KafkaTopics,
  type RetryMessage,
} from "@shared";
import { MechanicalService } from "../service/MechanicalService";

@Controller("events")
export class EventController implements IRetryCommands {
  constructor(private readonly mechanicalService: MechanicalService) {}

  @EventPattern(KafkaTopics.RETRY)
  onRetryEvent(@Payload() message: RetryMessage) {
    if (message.cluster === Cluster.MECHANICAL) {
      this.mechanicalService.retry(message);
    }
  }
}
