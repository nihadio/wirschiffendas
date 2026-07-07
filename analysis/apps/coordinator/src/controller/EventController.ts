import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { KafkaTopics, type ResultMessage, type StatusMessage } from "@shared";
import { AnalysisService } from "../service/AnalysisService";

@Controller("events")
export class EventController {
  constructor(private analysisService: AnalysisService) {}

  @EventPattern(KafkaTopics.STATUS) onStatusEvent(
    @Payload() message: StatusMessage,
  ) {
    this.analysisService.applyStatusMessage(message);
  }

  @EventPattern(KafkaTopics.RESULT) onResultEvent(
    @Payload() message: ResultMessage,
  ) {
    this.analysisService.applyResultMessage(message);
  }
}
