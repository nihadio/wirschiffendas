import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions } from "@nestjs/microservices";
import { MechanicalModule } from "./MechanicalModule";
import {
  createKafkaOptions,
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
  setupOpenApi,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(MechanicalModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);
  setupOpenApi(app, { title: "Mechanical", version: "0.0.1" });

  app.connectMicroservice<MicroserviceOptions>(
    createKafkaOptions("mechanical"),
  );

  await app.startAllMicroservices();

  await app.listen(ENV.port);
}
void bootstrap();
