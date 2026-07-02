import { NestFactory } from '@nestjs/core';
import { FluidsServiceModule } from './fluids-service.module';

async function bootstrap() {
  const app = await NestFactory.create(FluidsServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
