import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { EmsClient } from "./client/EmsClient";
import { EventController } from "./controller/EventController";
import { MechanicalController } from "./controller/MechanicalController";
import { MechanicalService } from "./service/MechanicalService";
import {
  createKafkaClientProvider,
  HealthController,
  HttpClient,
  KafkaClient,
  SimulationController,
  SimulationService,
} from "@shared";
import { ClientsModule } from "@nestjs/microservices";

@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()]), HttpModule],
  controllers: [
    MechanicalController,
    EventController,
    SimulationController,
    HealthController,
  ],
  providers: [
    MechanicalService,
    EmsClient,
    HttpClient,
    KafkaClient,
    SimulationService,
  ],
})
export class MechanicalModule {}
