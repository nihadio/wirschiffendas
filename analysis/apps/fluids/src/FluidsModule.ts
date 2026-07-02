import { Module } from "@nestjs/common";
import { FluidsController } from "./FluidsController";
import { FluidsService } from "./FluidsService";

@Module({
  imports: [],
  controllers: [FluidsController],
  providers: [FluidsService],
})
export class FluidsModule {}
