import { NestFactory } from '@nestjs/core';
import { DrivetrainServiceModule } from './drivetrain-service.module';

async function bootstrap() {
  const app = await NestFactory.create(DrivetrainServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
