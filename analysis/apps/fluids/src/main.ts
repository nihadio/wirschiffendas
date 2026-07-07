import { ENV } from "./environment";
import { NestFactory } from "@nestjs/core";
import { FluidsModule } from "./FluidsModule";
import {
  setupGlobalExceptionFilter,
  setupGlobalValidationPipe,
  setupSwagger,
} from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(FluidsModule);

  setupGlobalValidationPipe(app);
  setupGlobalExceptionFilter(app);
  setupSwagger(app, { title: "Fluids" });

  await app.listen(ENV.port);
}
void bootstrap();
