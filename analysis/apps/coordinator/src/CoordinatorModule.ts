import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { HttpClient } from "@shared";
import { AlgorithmClient } from "./client/AlgorithmClient";
import { ConfigClient } from "./client/ConfigClient";
import { SimulationClient } from "./client/SimulationClient";
import { AnalysisController } from "./controller/AnalysisController";
import { EventController } from "./controller/EventController";
import { SimulationController } from "./controller/SimulationController";
import { ClusterGateway } from "./gateway/ClusterGateway";
import { AnalysisService } from "./service/AnalysisService";

@Module({
  imports: [HttpModule],
  controllers: [EventController, AnalysisController, SimulationController],
  providers: [
    AnalysisService,
    ClusterGateway,
    ConfigClient,
    AlgorithmClient,
    SimulationClient,
    HttpClient,
  ],
})
export class CoordinatorModule {}
