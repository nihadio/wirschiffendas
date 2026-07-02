import { NestFactory } from "@nestjs/core";
import { FluidsModule } from "./FluidsModule";
import { PORTS } from "@shared";

async function bootstrap() {
  const app = await NestFactory.create(FluidsModule);
  await app.listen(PORTS.fluids);
}
void bootstrap();
