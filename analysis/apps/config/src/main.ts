import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { ConfigModule } from "./ConfigModule";
import {
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
  setupOpenApi,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(ConfigModule);

  app.enableCors();

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);
  setupOpenApi(app, { title: "Config-Service", version: "0.0.1" });

  await app.listen(ENV.port);
}

void bootstrap();
