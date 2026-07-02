import { Module } from "@nestjs/common";
import { ConfigController } from "./ConfigController";
import { ConfigService } from "./ConfigService";
import { Config } from "./Config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CONFIG } from "@shared";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      ...CONFIG.env.configDb,
      entities: [Config],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Config]),
  ],
  controllers: [ConfigController],
  providers: [ConfigService],
})
export class ConfigModule {}
