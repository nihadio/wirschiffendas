import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { FluidsController } from "./FluidsController";
import { FluidsService } from "./FluidsService";
import {
  createKafkaClientProvider,
  SimulationController,
  SimulationStateService,
} from "@shared";
import { ClientsModule } from "@nestjs/microservices";

@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()]), HttpModule],
  controllers: [FluidsController, SimulationController],
  providers: [FluidsService, SimulationStateService],
})
export class FluidsModule {}
