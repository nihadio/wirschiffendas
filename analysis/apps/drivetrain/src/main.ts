import { NestFactory } from "@nestjs/core";
import { DrivetrainModule } from "./DrivetrainModule";
import {
  CONFIG,
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
  setupSwagger,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(DrivetrainModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);
  setupSwagger(app, { title: "Drivetrain" });

  await app.listen(CONFIG.ports.drivetrain);
}
void bootstrap();
