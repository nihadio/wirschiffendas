import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { KafkaTopics, type ResultMessage } from "@shared";
import { EmsService } from "../service/EmsService";

@Controller("events")
export class EventController {
  constructor(private readonly emsService: EmsService) {}

  @EventPattern(KafkaTopics.RESULT)
  onResultEvent(@Payload() message: ResultMessage) {
    this.emsService.rememberUpstreamResults(message);
  }
}
