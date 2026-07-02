import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "./ConfigModule";
import { CONFIG, setupSwagger } from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(ConfigModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  setupSwagger(app, {
    title: "Config",
  });

  await app.listen(CONFIG.ports.config);
}

void bootstrap();
