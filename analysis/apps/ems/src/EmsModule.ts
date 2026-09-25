import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";
import {
  createKafkaClientProvider,
  EVENT_PUBLISHER,
  HealthController,
  KafkaClient,
  SimulationController,
  SimulationService,
} from "@shared";
import { EmsController } from "./controller/EmsController";
import { EventController } from "./controller/EventController";
import { EmsService } from "./service/EmsService";

// The module is the assembler: it binds each required interface (token) to a provider.
@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()])],
  controllers: [
    EmsController,
    EventController,
    SimulationController,
    HealthController,
  ],
  providers: [
    EmsService,
    { provide: EVENT_PUBLISHER, useClass: KafkaClient },
    SimulationService,
  ],
})
export class EmsModule {}
