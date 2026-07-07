import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { EmsModule } from "./EmsModule";
import {
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
  setupSwagger,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(EmsModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);
  setupSwagger(app, { title: "EMS" });

  await app.listen(ENV.port);
}
void bootstrap();
