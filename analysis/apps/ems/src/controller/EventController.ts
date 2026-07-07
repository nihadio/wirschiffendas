import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { KafkaTopics, type StatusMessage } from "@shared";
import { EmsService } from "../service/EmsService";

@Controller("events")
export class EventController {
  constructor(private readonly emsService: EmsService) {}

  @EventPattern(KafkaTopics.STATUS)
  onStatusEvent(@Payload() message: StatusMessage) {
    this.emsService.handleUpstreamStatus(message);
  }
}
