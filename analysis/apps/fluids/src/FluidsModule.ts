import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { DrivetrainClient } from "./client/DrivetrainClient";
import { MechanicalClient } from "./client/MechanicalClient";
import { EventController } from "./controller/EventController";
import { FluidsController } from "./controller/FluidsController";
import { FluidsService } from "./service/FluidsService";
import {
  createKafkaClientProvider,
  DRIVETRAIN_ANALYZE,
  EVENT_PUBLISHER,
  HealthController,
  HttpClient,
  KafkaClient,
  MECHANICAL_ANALYZE,
  SimulationController,
  SimulationService,
} from "@shared";
import { ClientsModule } from "@nestjs/microservices";

// The module is the assembler: it binds each required interface (token) to a provider.
@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()]), HttpModule],
  controllers: [
    FluidsController,
    EventController,
    SimulationController,
    HealthController,
  ],
  providers: [
    FluidsService,
    { provide: DRIVETRAIN_ANALYZE, useClass: DrivetrainClient },
    { provide: MECHANICAL_ANALYZE, useClass: MechanicalClient },
    { provide: EVENT_PUBLISHER, useClass: KafkaClient },
    HttpClient,
    SimulationService,
  ],
})
export class FluidsModule {}
