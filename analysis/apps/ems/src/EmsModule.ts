import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";
import {
  createKafkaClientProvider,
  KafkaClient,
  SimulationController,
  SimulationService,
} from "@shared";
import { EmsController } from "./controller/EmsController";
import { EmsService } from "./service/EmsService";

@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()])],
  controllers: [EmsController, SimulationController],
  providers: [EmsService, KafkaClient, SimulationService],
})
export class EmsModule {}
