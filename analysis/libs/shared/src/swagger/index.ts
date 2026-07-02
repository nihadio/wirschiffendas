import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export interface SwaggerSetupOptions {
  title: string;
  description?: string;
  version?: string;
  path?: string;
  tags?: string[];
}

export function setupSwagger(
  app: INestApplication,
  optionsOrTitle: SwaggerSetupOptions | string,
): void {
  const options =
    typeof optionsOrTitle === "string"
      ? { title: optionsOrTitle }
      : optionsOrTitle;

  const builder = new DocumentBuilder()
    .setTitle(options.title)
    .setDescription(
      options.description ?? `WirSchiffenDas Analysis - ${options.title}`,
    )
    .setVersion(options.version ?? "1.0");

  for (const tag of options.tags ?? []) {
    builder.addTag(tag);
  }

  const config = builder.build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(options.path ?? "docs", app, document, {
    customSiteTitle: `${options.title} docs`,
  });
}
