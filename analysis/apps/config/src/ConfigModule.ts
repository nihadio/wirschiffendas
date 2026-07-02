import { Module } from "@nestjs/common";
import { ConfigController } from "./ConfigController";
import { ConfigService } from "./ConfigService";
import { Config } from "./Config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ENV } from "wsd/shared";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      ...ENV.configDb,
      entities: [Config],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Config]),
  ],
  controllers: [ConfigController],
  providers: [ConfigService],
})
export class ConfigModule {}
