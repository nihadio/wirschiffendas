import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { Cluster, KafkaTopics, type RetryMessage } from "@shared";
import { DrivetrainService } from "../service/DrivetrainService";

@Controller("events")
export class EventController {
  constructor(private readonly drivetrainService: DrivetrainService) {}

  @EventPattern(KafkaTopics.RETRY)
  onRetryEvent(@Payload() message: RetryMessage) {
    if (message.cluster === Cluster.DRIVETRAIN) {
      this.drivetrainService.retry(message);
    }
  }
}
