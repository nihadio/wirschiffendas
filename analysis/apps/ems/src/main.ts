import { NestFactory } from '@nestjs/core';
import { EmsModule } from './EmsModule';

async function bootstrap() {
  const app = await NestFactory.create(EmsModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
