import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { DrivetrainController } from "./DrivetrainController";
import { DrivetrainService } from "./DrivetrainService";
import {
  createKafkaClientProvider,
  SimulationController,
  SimulationStateService,
} from "@shared";
import { ClientsModule } from "@nestjs/microservices";

@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()]), HttpModule],
  controllers: [DrivetrainController, SimulationController],
  providers: [DrivetrainService, SimulationStateService],
})
export class DrivetrainModule {}
