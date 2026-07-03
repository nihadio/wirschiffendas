import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { FluidsController } from "./FluidsController";
import { FluidsService } from "./FluidsService";
import { createKafkaClientProvider } from "@shared";
import { ClientsModule } from "@nestjs/microservices";

@Module({
  imports: [ClientsModule.register([createKafkaClientProvider()]), HttpModule],
  controllers: [FluidsController],
  providers: [FluidsService],
})
export class FluidsModule {}
