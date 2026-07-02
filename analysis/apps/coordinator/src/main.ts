import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { MicroserviceOptions } from "@nestjs/microservices";
import { CONFIG, createKafkaOptions, setupSwagger } from "@shared";
import { CoordinatorModule } from "./CoordinatorModule";

async function bootstrap() {
  const app = await NestFactory.create(CoordinatorModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  setupSwagger(app, {
    title: "Coordinator",
  });

  app.connectMicroservice<MicroserviceOptions>(
    createKafkaOptions("coordinator"),
  );

  await app.startAllMicroservices();

  await app.listen(CONFIG.ports.coordinator);
}
void bootstrap();
