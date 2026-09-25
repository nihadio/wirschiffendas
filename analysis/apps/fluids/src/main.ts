import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions } from "@nestjs/microservices";
import { FluidsModule } from "./FluidsModule";
import {
  createKafkaOptions,
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
  setupOpenApi,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(FluidsModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);
  setupOpenApi(app, { title: "Fluids", version: "0.0.1" });

  app.connectMicroservice<MicroserviceOptions>(createKafkaOptions("fluids"));

  await app.startAllMicroservices();

  await app.listen(ENV.port);
}
void bootstrap();
