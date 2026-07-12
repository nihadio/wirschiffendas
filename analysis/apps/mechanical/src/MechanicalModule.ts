import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { EmsClient } from "./client/EmsClient";
import { MechanicalController } from "./controller/MechanicalController";
import { MechanicalService } from "./service/MechanicalService";
import {
  createKafkaClientProvider,
  HttpClient,
  KafkaClient,
  SimulationController,
  SimulationService,
} from "@shared";
import { ClientsModule } from "@nestjs/microservices";

@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()]), HttpModule],
  controllers: [MechanicalController, SimulationController],
  providers: [
    MechanicalService,
    EmsClient,
    HttpClient,
    KafkaClient,
    SimulationService,
  ],
})
export class MechanicalModule {}
