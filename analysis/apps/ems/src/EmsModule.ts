import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";
import {
  createKafkaClientProvider,
  SimulationController,
  SimulationStateService,
} from "@shared";
import { EmsController } from "./EmsController";
import { EmsService } from "./EmsService";

@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()])],
  controllers: [EmsController, SimulationController],
  providers: [EmsService, SimulationStateService],
})
export class EmsModule {}
