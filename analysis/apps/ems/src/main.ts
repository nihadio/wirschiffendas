import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions } from "@nestjs/microservices";
import { EmsModule } from "./EmsModule";
import {
  createKafkaOptions,
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
  setupSwagger,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(EmsModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);
  setupSwagger(app, { title: "EMS" });

  app.connectMicroservice<MicroserviceOptions>(createKafkaOptions("ems"));

  await app.startAllMicroservices();

  await app.listen(ENV.port);
}
void bootstrap();
