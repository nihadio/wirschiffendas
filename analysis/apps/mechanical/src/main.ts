import { NestFactory } from "@nestjs/core";
import { MechanicalModule } from "./MechanicalModule";

async function bootstrap() {
  const app = await NestFactory.create(MechanicalModule);
  await app.listen(process.env.port ?? 3000);
}
void bootstrap();
