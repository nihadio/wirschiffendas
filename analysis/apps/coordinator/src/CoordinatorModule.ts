import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { EventController } from "./EventController";
import { AnalysisController } from "./AnalysisController";
import { AnalysisService } from "./AnalysisService";
import { ClusterGateway } from "./ClusterGateway";
import { SimulationController } from "./SimulationController";

@Module({
  imports: [HttpModule],
  controllers: [EventController, AnalysisController, SimulationController],
  providers: [AnalysisService, ClusterGateway],
})
export class CoordinatorModule {}
