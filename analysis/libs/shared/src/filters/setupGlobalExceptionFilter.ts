import type { INestApplication } from "@nestjs/common";
import { GlobalHttpExceptionFilter } from "./GlobalHttpExceptionFilter";

export function setupGlobalExceptionFilter(app: INestApplication) {
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
}
