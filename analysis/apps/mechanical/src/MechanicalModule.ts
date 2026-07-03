import { Module } from "@nestjs/common";
import { MechanicalController } from "./MechanicalController";
import { MechanicalService } from "./MechanicalService";
import { createKafkaClientProvider } from "@shared";
import { ClientsModule } from "@nestjs/microservices";

@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()])],
  controllers: [MechanicalController],
  providers: [MechanicalService],
})
export class MechanicalModule {}
