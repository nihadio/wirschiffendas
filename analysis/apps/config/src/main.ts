import { NestFactory } from "@nestjs/core";
import { ConfigModule } from "./ConfigModule";
import {
  CONFIG,
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
  setupSwagger,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(ConfigModule);

  app.enableCors();

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);
  setupSwagger(app, { title: "Config" });

  await app.listen(CONFIG.ports.config);
}

void bootstrap();
