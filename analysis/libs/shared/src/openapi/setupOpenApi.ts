import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export type OpenApiInfo = { title: string; version: string };

/** Publishes the provided REST interface: UI at /api-docs, JSON at /api-docs-json. */
export function setupOpenApi(app: INestApplication, info: OpenApiInfo) {
  const config = new DocumentBuilder()
    .setTitle(info.title)
    .setVersion(info.version)
    .build();

  SwaggerModule.setup("api-docs", app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
