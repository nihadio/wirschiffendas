import { ValidationPipe, type INestApplication } from "@nestjs/common";

export function setupGlobalValidationPipe(app: INestApplication) {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
}
