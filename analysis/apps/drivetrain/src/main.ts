import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { DrivetrainModule } from "./DrivetrainModule";
import { setupGlobalExceptionFilter, setupGlobalValidationPipe } from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(DrivetrainModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);

  await app.listen(ENV.port);
}
void bootstrap();
