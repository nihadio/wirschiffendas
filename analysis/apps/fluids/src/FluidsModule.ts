import { Module } from "@nestjs/common";
import { FluidsController } from "./FluidsController";
import { FluidsService } from "./FluidsService";
import { CONFIG } from "@shared";
import { ClientsModule } from "@nestjs/microservices";

@Module({
  imports: [ClientsModule.register([CONFIG.kafkaProviderOptions])],
  controllers: [FluidsController],
  providers: [FluidsService],
})
export class FluidsModule {}
