import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { EmsModule } from "./EmsModule";
import { setupGlobalExceptionFilter, setupGlobalValidationPipe } from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(EmsModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);

  await app.listen(ENV.port);
}
void bootstrap();
