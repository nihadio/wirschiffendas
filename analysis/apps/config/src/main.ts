import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { ConfigModule } from "./ConfigModule";
import { setupGlobalExceptionFilter, setupGlobalValidationPipe } from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(ConfigModule);

  app.enableCors();

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);

  await app.listen(ENV.port);
}

void bootstrap();
