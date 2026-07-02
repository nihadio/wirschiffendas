import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { FluidsModule } from "./FluidsModule";
import { CONFIG, setupSwagger } from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(FluidsModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  setupSwagger(app, {
    title: "Fluids",
  });

  await app.listen(CONFIG.ports.fluids);
}
void bootstrap();
