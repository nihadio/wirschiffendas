import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions } from "@nestjs/microservices";
import { MechanicalModule } from "./MechanicalModule";
import {
  createKafkaOptions,
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(MechanicalModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);

  app.connectMicroservice<MicroserviceOptions>(
    createKafkaOptions("mechanical"),
  );

  await app.startAllMicroservices();

  await app.listen(ENV.port);
}
void bootstrap();
