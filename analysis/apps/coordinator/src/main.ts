import { NestFactory } from '@nestjs/core';
import { CoordinatorModule } from './CoordinatorModule';

async function bootstrap() {
  const app = await NestFactory.create(CoordinatorModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
