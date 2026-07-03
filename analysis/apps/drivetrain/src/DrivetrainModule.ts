import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { DrivetrainController } from "./DrivetrainController";
import { DrivetrainService } from "./DrivetrainService";
import { createKafkaClientProvider } from "@shared";
import { ClientsModule } from "@nestjs/microservices";

@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()]), HttpModule],
  controllers: [DrivetrainController],
  providers: [DrivetrainService],
})
export class DrivetrainModule {}
