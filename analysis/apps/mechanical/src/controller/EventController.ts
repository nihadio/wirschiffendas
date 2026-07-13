import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { Cluster, KafkaTopics, type RetryMessage } from "@shared";
import { MechanicalService } from "../service/MechanicalService";

@Controller("events")
export class EventController {
  constructor(private readonly mechanicalService: MechanicalService) {}

  @EventPattern(KafkaTopics.RETRY)
  onRetryEvent(@Payload() message: RetryMessage) {
    if (message.cluster === Cluster.MECHANICAL) {
      this.mechanicalService.retry(message);
    }
  }
}
