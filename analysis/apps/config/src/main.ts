import { NestFactory } from "@nestjs/core";
import { ConfigModule } from "./ConfigModule";
import { PORTS } from "wsd/shared/constants";
import { ValidationPipe } from "@nestjs/common/pipes/validation.pipe";

async function bootstrap() {
  const app = await NestFactory.create(ConfigModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(PORTS.config);
}

void bootstrap();
