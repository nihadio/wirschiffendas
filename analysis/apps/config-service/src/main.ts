import { NestFactory } from '@nestjs/core';
import { ConfigServiceModule } from './config-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ConfigServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
