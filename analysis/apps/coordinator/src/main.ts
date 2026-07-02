import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions } from "@nestjs/microservices";
import { CONFIG, createKafkaOptions } from "@shared";
import { CoordinatorModule } from "./CoordinatorModule";

async function bootstrap() {
  const app = await NestFactory.create(CoordinatorModule);

  app.enableCors();

  app.connectMicroservice<MicroserviceOptions>(
    createKafkaOptions("coordinator"),
  );

  await app.startAllMicroservices();

  await app.listen(CONFIG.ports.coordinator);
}
void bootstrap();
