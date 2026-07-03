import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { MechanicalModule } from "./MechanicalModule";
import { CONFIG, setupSwagger } from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(MechanicalModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  setupSwagger(app, {
    title: "Mechanical",
  });

  await app.listen(CONFIG.ports.mechanical);
}
void bootstrap();
