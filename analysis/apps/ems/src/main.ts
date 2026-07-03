import { NestFactory } from "@nestjs/core";
import { EmsModule } from "./EmsModule";
import {
  CONFIG,
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
  setupSwagger,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(EmsModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);
  setupSwagger(app, { title: "EMS" });

  await app.listen(CONFIG.ports.ems);
}
void bootstrap();
