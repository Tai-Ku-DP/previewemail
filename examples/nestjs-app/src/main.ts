import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Important: CORS is handled natively here or dynamically inside PreviewMailModule based on allowedOrigins!
  app.enableCors(); 
  
  await app.listen(3001);
  console.log('🚀 PreviewMail Test Server running on http://localhost:3001');
  console.log('-----------------------------------------------------------');
  console.log('Test Endpoints (Requires Header: X-PreviewMail-Key: my-super-secret-key)');
  console.log('GET    /previewmail/templates');
  console.log('POST   /previewmail/templates');
  console.log('GET    /previewmail/templates/:alias');
  console.log('PUT    /previewmail/templates/:id');
  console.log('DELETE /previewmail/templates/:id');
  
  console.log('\nMake sure MongoDB is running locally on port 27017!');
}
bootstrap();
