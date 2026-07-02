import { Module } from "@nestjs/common";
import { FluidsController } from "./FluidsController";
import { FluidsService } from "./FluidsService";
import { createKafkaClientProvider } from "@shared";
import { ClientsModule } from "@nestjs/microservices";

@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()])],
  controllers: [FluidsController],
  providers: [FluidsService],
})
export class FluidsModule {}
