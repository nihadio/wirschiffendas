import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { MechanicalModule } from "./MechanicalModule";
import {
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(MechanicalModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);

  await app.listen(ENV.port);
}
void bootstrap();
