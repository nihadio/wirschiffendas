import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import {
  CONFIG_LOOKUP,
  createKafkaClientProvider,
  EVENT_PUBLISHER,
  FLUIDS_ANALYZE,
  HealthController,
  HttpClient,
  KafkaClient,
  SIMULATION_CLIENT,
} from "@shared";
import { ConfigClient } from "./client/ConfigClient";
import { FluidsClient } from "./client/FluidsClient";
import { SimulationClient } from "./client/SimulationClient";
import { AnalysisController } from "./controller/AnalysisController";
import { EventController } from "./controller/EventController";
import { SimulationController } from "./controller/SimulationController";
import { ClusterGateway } from "./gateway/ClusterGateway";
import { AnalysisService } from "./service/AnalysisService";
import { ClientsModule } from "@nestjs/microservices";

// The module is the assembler: it binds each required interface (token) to a provider.
@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()]), HttpModule],
  controllers: [
    EventController,
    AnalysisController,
    SimulationController,
    HealthController,
  ],
  providers: [
    AnalysisService,
    ClusterGateway,
    { provide: CONFIG_LOOKUP, useClass: ConfigClient },
    { provide: FLUIDS_ANALYZE, useClass: FluidsClient },
    { provide: SIMULATION_CLIENT, useClass: SimulationClient },
    { provide: EVENT_PUBLISHER, useClass: KafkaClient },
    HttpClient,
  ],
})
export class CoordinatorModule {}
