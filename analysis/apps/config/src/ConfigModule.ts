import { Module } from "@nestjs/common";
import { ConfigController } from "./ConfigController";
import { ConfigService } from "./ConfigService";

@Module({
  imports: [],
  controllers: [ConfigController],
  providers: [ConfigService],
})
export class ConfigModule {}
