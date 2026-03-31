import { Module } from '@nestjs/common';
import { PreviewMailModule } from '@previewmail/nestjs';
import { MongoDBAdapter } from '@previewmail/adapter-mongodb';

@Module({
  imports: [
    PreviewMailModule.forRoot({
      apiKey: process.env.PREVIEWMAIL_API_KEY || 'default-secret-key',
      allowedOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','), // Support multiple origins by comma
      storage: new MongoDBAdapter(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/previewmail_test'),
      rateLimit: { max: 100, windowMs: 60000 },
      cache: { ttl: 60000, max: 100 }
    }),
  ],
})
export class AppModule {}
