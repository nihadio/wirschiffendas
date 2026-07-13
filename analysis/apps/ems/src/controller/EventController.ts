import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { KafkaTopics, type RetryMessage, type StatusMessage } from "@shared";
import { EmsService } from "../service/EmsService";

@Controller("events")
export class EventController {
  constructor(private readonly emsService: EmsService) {}

  @EventPattern(KafkaTopics.STATUS)
  onStatusEvent(@Payload() message: StatusMessage) {
    this.emsService.handleStatusMessage(message);
  }

  @EventPattern(KafkaTopics.RETRY)
  onRetryEvent(@Payload() message: RetryMessage) {
    this.emsService.handleRetry(message);
  }
}
