import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { MechanicalController } from "./MechanicalController";
import { MechanicalService } from "./MechanicalService";
import { createKafkaClientProvider } from "@shared";
import { ClientsModule } from "@nestjs/microservices";

@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()]), HttpModule],
  controllers: [MechanicalController],
  providers: [MechanicalService],
})
export class MechanicalModule {}
