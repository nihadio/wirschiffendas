import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DrivetrainModule } from "./DrivetrainModule";
import { CONFIG, setupSwagger } from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(DrivetrainModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  setupSwagger(app, {
    title: "Drivetrain",
  });

  await app.listen(CONFIG.ports.drivetrain);
}
void bootstrap();
