import { NestFactory } from '@nestjs/core';
import { EmsServiceModule } from './ems-service.module';

async function bootstrap() {
  const app = await NestFactory.create(EmsServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
