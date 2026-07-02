import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { EventController } from "./EventController";
import { AnalysisController } from "./AnalysisController";
import { AnalysisService } from "./AnalysisService";

@Module({
  imports: [HttpModule],
  controllers: [EventController, AnalysisController],
  providers: [AnalysisService],
})
export class CoordinatorModule {}
