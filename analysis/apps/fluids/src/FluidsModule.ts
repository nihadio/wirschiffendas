import { Module } from "@nestjs/common";
import { FluidsController } from "./FluidsController";
import { FluidsService } from "./FluidsService";
import { KAFKA_CONFIG } from "@shared";
import { ClientsModule } from "@nestjs/microservices";

@Module({
  imports: [ClientsModule.register([KAFKA_CONFIG])],
  controllers: [FluidsController],
  providers: [FluidsService],
})
export class FluidsModule {}
