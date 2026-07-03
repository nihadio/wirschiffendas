import { NestFactory } from "@nestjs/core";
import { FluidsModule } from "./FluidsModule";
import {
  CONFIG,
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
  setupSwagger,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(FluidsModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);
  setupSwagger(app, { title: "Fluids" });

  await app.listen(CONFIG.ports.fluids);
}
void bootstrap();
