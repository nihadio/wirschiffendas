import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HealthController } from "@shared";
import { ConfigController } from "./controller/ConfigController";
import { Config } from "./entity/Config";
import { ENV } from "./environment";
import { ConfigService } from "./service/ConfigService";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      ...ENV.database,
      entities: [Config],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Config]),
  ],
  controllers: [ConfigController, HealthController],
  providers: [ConfigService],
})
export class ConfigModule {}
