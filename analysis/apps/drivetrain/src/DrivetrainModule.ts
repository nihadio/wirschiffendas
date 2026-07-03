import { Module } from "@nestjs/common";
import { DrivetrainController } from "./DrivetrainController";
import { DrivetrainService } from "./DrivetrainService";
import { createKafkaClientProvider } from "@shared";
import { ClientsModule } from "@nestjs/microservices";

@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()])],
  controllers: [DrivetrainController],
  providers: [DrivetrainService],
})
export class DrivetrainModule {}
