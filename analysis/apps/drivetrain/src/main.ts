import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions } from "@nestjs/microservices";
import { DrivetrainModule } from "./DrivetrainModule";
import {
  createKafkaOptions,
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
  setupOpenApi,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(DrivetrainModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);
  setupOpenApi(app, { title: "Drivetrain", version: "0.0.1" });

  app.connectMicroservice<MicroserviceOptions>(
    createKafkaOptions("drivetrain"),
  );

  await app.startAllMicroservices();

  await app.listen(ENV.port);
}
void bootstrap();
