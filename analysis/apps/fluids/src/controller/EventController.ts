import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { Cluster, KafkaTopics, type RetryMessage } from "@shared";
import { FluidsService } from "../service/FluidsService";

@Controller("events")
export class EventController {
  constructor(private readonly fluidsService: FluidsService) {}

  @EventPattern(KafkaTopics.RETRY)
  onRetryEvent(@Payload() message: RetryMessage) {
    if (message.cluster === Cluster.FLUIDS) {
      this.fluidsService.retry(message);
    }
  }
}
