import { NestFactory } from '@nestjs/core';
import { MechanicalServiceModule } from './mechanical-service.module';

async function bootstrap() {
  const app = await NestFactory.create(MechanicalServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
