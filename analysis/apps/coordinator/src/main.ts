import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions } from "@nestjs/microservices";
import {
  createKafkaOptions,
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
  setupSwagger,
} from "@shared";
import { CoordinatorModule } from "./CoordinatorModule";

async function bootstrap() {
  const app = await NestFactory.create(CoordinatorModule);

  app.enableCors();

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);
  setupSwagger(app, { title: "Coordinator" });

  app.connectMicroservice<MicroserviceOptions>(
    createKafkaOptions("coordinator"),
  );

  await app.startAllMicroservices();

  await app.listen(ENV.port);
}
void bootstrap();
