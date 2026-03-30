import { Module } from '@nestjs/common';
import { PreviewMailModule } from '@previewmail/nestjs';
import { MongoDBAdapter } from '@previewmail/adapter-mongodb';

@Module({
  imports: [
    PreviewMailModule.forRoot({
      apiKey: 'my-super-secret-key', // Set API key here
      allowedOrigins: ['http://localhost:3000'], // Allow the Next.js frontend to talk to us
      storage: new MongoDBAdapter('mongodb://127.0.0.1:27017/previewmail_test'), // Note: Replace with your actual local MongoDB or Atlas URI if not using local!
      rateLimit: { max: 100, windowMs: 60000 },
      cache: { ttl: 60000, max: 100 }
    }),
  ],
})
export class AppModule {}
