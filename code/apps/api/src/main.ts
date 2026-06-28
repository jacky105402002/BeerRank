import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser("json", { limit: "15mb" });
  app.useBodyParser("urlencoded", { limit: "15mb", extended: true });
  app.setGlobalPrefix("api");
  const frontendOrigins = process.env.FRONTEND_ORIGINS
    ? process.env.FRONTEND_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : ["http://localhost:6666", "http://127.0.0.1:6666", "http://localhost:6677", "http://127.0.0.1:6677"];
  app.enableCors({
    origin: frontendOrigins
  });

  const config = new DocumentBuilder()
    .setTitle("BeerRank API")
    .setDescription("Mock-first API contract for the BeerRank MVP engineering loop.")
    .setVersion("0.1.0")
    .addTag("BeerRank MVP")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true
    }
  });

  const requestedPort = Number(process.env.PORT ?? process.env.WEB_PORT ?? 3001);
  const port = Number.isFinite(requestedPort) ? requestedPort : 3001;
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
