import { NestFactory } from "@nestjs/core";
import { DrivetrainModule } from "./DrivetrainModule";

async function bootstrap() {
  const app = await NestFactory.create(DrivetrainModule);
  await app.listen(process.env.port ?? 3000);
}
void bootstrap();
