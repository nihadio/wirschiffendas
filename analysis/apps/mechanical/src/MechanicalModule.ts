import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { EmsClient } from "./client/EmsClient";
import { EventController } from "./controller/EventController";
import { MechanicalController } from "./controller/MechanicalController";
import { MechanicalService } from "./service/MechanicalService";
import {
  createKafkaClientProvider,
  EMS_ANALYZE,
  EVENT_PUBLISHER,
  HealthController,
  HttpClient,
  KafkaClient,
  SimulationController,
  SimulationService,
} from "@shared";
import { ClientsModule } from "@nestjs/microservices";

// The module is the assembler: it binds each required interface (token) to a provider.
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
    { provide: EMS_ANALYZE, useClass: EmsClient },
    { provide: EVENT_PUBLISHER, useClass: KafkaClient },
    HttpClient,
    SimulationService,
  ],
})
export class MechanicalModule {}
