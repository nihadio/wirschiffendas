import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import swaggerUiDist from "swagger-ui-dist";

const swaggerUiAssets = swaggerUiDist as {
  getAbsoluteFSPath: () => string;
};

export interface SwaggerSetupOptions {
  title: string;
  description?: string;
  version?: string;
  path?: string;
  tags?: string[];
}

export function setupSwagger(
  app: INestApplication,
  options: SwaggerSetupOptions,
): void {
  const {
    title,
    description,
    version = "1.0.0",
    path = "docs",
    tags = [],
  } = options;

  const builder = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description ?? `WirSchiffenDas Analysis - ${title} API`)
    .setVersion(version);

  for (const tag of tags) {
    builder.addTag(tag);
  }

  const config = builder.build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(path, app, document, {
    customSiteTitle: `${title} docs`,
    customSwaggerUiPath: swaggerUiAssets.getAbsoluteFSPath(),
  });
}
