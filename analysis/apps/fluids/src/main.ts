import { NestFactory } from '@nestjs/core';
import { FluidsModule } from './FluidsModule';

async function bootstrap() {
  const app = await NestFactory.create(FluidsModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
