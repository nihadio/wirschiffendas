import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions } from "@nestjs/microservices";
import { EmsModule } from "./EmsModule";
import {
  createKafkaOptions,
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
  setupOpenApi,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(EmsModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);
  setupOpenApi(app, { title: "EMS", version: "0.0.1" });

  app.connectMicroservice<MicroserviceOptions>(createKafkaOptions("ems"));

  await app.startAllMicroservices();

  await app.listen(ENV.port);
}
void bootstrap();
