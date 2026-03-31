import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-PreviewMail-Key', 'Accept'],
    credentials: true,
  });
  const port = process.env.PORT || 3001;
  const apiKey = process.env.PREVIEWMAIL_API_KEY || "default-secret-key";

  console.log("API Key: ", apiKey);
  console.log("Port: ", port);

  await app.listen(port);
  console.log(`🚀 PreviewMail Test Server running on http://localhost:${port}`);
  console.log("-----------------------------------------------------------");
  console.log(`Test Endpoints (Requires Header: X-PreviewMail-Key: ${apiKey})`);
  console.log("GET    /previewmail/templates");
  console.log("POST   /previewmail/templates");
  console.log("GET    /previewmail/templates/:alias");
  console.log("PUT    /previewmail/templates/:id");
  console.log("DELETE /previewmail/templates/:id");

  console.log("\nMake sure MongoDB is running locally on port 27017!");
}
bootstrap();
