import { NestFactory } from "@nestjs/core";
import { CONFIG } from "@shared";
import { CoordinatorModule } from "./CoordinatorModule";

async function bootstrap() {
  const app = await NestFactory.create(CoordinatorModule);
  await app.listen(CONFIG.ports.coordinator);
}
void bootstrap();
