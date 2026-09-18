import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";
import {
  createKafkaClientProvider,
  HealthController,
  KafkaClient,
  SimulationController,
  SimulationService,
} from "@shared";
import { EmsController } from "./controller/EmsController";
import { EventController } from "./controller/EventController";
import { EmsService } from "./service/EmsService";

@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()])],
  controllers: [
    EmsController,
    EventController,
    SimulationController,
    HealthController,
  ],
  providers: [EmsService, KafkaClient, SimulationService],
})
export class EmsModule {}
