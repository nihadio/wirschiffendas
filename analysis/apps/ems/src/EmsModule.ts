import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";
import { createKafkaClientProvider } from "@shared";
import { EmsController } from "./EmsController";
import { EmsService } from "./EmsService";

@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()])],
  controllers: [EmsController],
  providers: [EmsService],
})
export class EmsModule {}
