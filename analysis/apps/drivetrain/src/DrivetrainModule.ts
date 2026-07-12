import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { EmsClient } from "./client/EmsClient";
import { DrivetrainController } from "./controller/DrivetrainController";
import { DrivetrainService } from "./service/DrivetrainService";
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
  controllers: [DrivetrainController, SimulationController],
  providers: [
    DrivetrainService,
    EmsClient,
    HttpClient,
    KafkaClient,
    SimulationService,
  ],
})
export class DrivetrainModule {}
