import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions } from "@nestjs/microservices";
import { FluidsModule } from "./FluidsModule";
import {
  createKafkaOptions,
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(FluidsModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);

  app.connectMicroservice<MicroserviceOptions>(createKafkaOptions("fluids"));

  await app.startAllMicroservices();

  await app.listen(ENV.port);
}
void bootstrap();
