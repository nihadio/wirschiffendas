import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { FluidsModule } from "./FluidsModule";
import {
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(FluidsModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);

  await app.listen(ENV.port);
}
void bootstrap();
