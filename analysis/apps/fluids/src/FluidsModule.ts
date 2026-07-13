import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { DrivetrainClient } from "./client/DrivetrainClient";
import { MechanicalClient } from "./client/MechanicalClient";
import { EventController } from "./controller/EventController";
import { FluidsController } from "./controller/FluidsController";
import { FluidsService } from "./service/FluidsService";
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
  controllers: [FluidsController, EventController, SimulationController],
  providers: [
    FluidsService,
    DrivetrainClient,
    MechanicalClient,
    HttpClient,
    KafkaClient,
    SimulationService,
  ],
})
export class FluidsModule {}
