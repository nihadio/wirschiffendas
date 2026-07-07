import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";
import {
  createKafkaClientProvider,
  KafkaClient,
  SimulationController,
  SimulationStateService,
} from "@shared";
import { EmsController } from "./controller/EmsController";
import { EmsService } from "./service/EmsService";

@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()])],
  controllers: [EmsController, SimulationController],
  providers: [EmsService, KafkaClient, SimulationStateService],
})
export class EmsModule {}
