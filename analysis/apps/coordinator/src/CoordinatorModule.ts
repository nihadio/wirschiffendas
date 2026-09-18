import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import {
  createKafkaClientProvider,
  HealthController,
  HttpClient,
  KafkaClient,
} from "@shared";
import { AlgorithmClient } from "./client/AlgorithmClient";
import { ConfigClient } from "./client/ConfigClient";
import { SimulationClient } from "./client/SimulationClient";
import { AnalysisController } from "./controller/AnalysisController";
import { EventController } from "./controller/EventController";
import { SimulationController } from "./controller/SimulationController";
import { ClusterGateway } from "./gateway/ClusterGateway";
import { AnalysisService } from "./service/AnalysisService";
import { ClientsModule } from "@nestjs/microservices";

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
    ConfigClient,
    AlgorithmClient,
    SimulationClient,
    HttpClient,
    KafkaClient,
  ],
})
export class CoordinatorModule {}
