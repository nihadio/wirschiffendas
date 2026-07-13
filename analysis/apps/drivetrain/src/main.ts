import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions } from "@nestjs/microservices";
import { DrivetrainModule } from "./DrivetrainModule";
import {
  createKafkaOptions,
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(DrivetrainModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);

  app.connectMicroservice<MicroserviceOptions>(
    createKafkaOptions("drivetrain"),
  );

  await app.startAllMicroservices();

  await app.listen(ENV.port);
}
void bootstrap();
