import { DynamicModule, Module, Global, ValidationPipe, MiddlewareConsumer, NestModule, Inject, RequestMethod } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { PreviewMailOptions } from './interfaces/preview-mail.interfaces';
import { PreviewMailService } from './preview-mail.service';
import { PreviewMailController } from './preview-mail.controller';
import { ApiKeyGuard } from './security/api-key.guard';
import { RateLimiterGuard } from './security/rate-limiter.guard';

@Global()
@Module({})
export class PreviewMailModule implements NestModule {
  constructor(@Inject('PREVIEW_MAIL_OPTIONS') private options: PreviewMailOptions) {}

  configure(consumer: MiddlewareConsumer) {
    if (this.options.allowedOrigins && this.options.allowedOrigins.length > 0) {
      consumer
        .apply((req: any, res: any, next: any) => {
          const origin = req.headers.origin;
          if (origin && this.options.allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-PreviewMail-Key');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          }
          if (req.method === 'OPTIONS') {
            res.status(204).end();
          } else {
            next();
          }
        })
        .forRoutes({ path: 'previewmail/templates*', method: RequestMethod.ALL });
    }
  }

  static forRoot(options: PreviewMailOptions): DynamicModule {
    return {
      module: PreviewMailModule,
      controllers: [PreviewMailController],
      providers: [
        {
          provide: 'PREVIEW_MAIL_OPTIONS',
          useValue: options,
        },
        PreviewMailService,
        ApiKeyGuard,
        RateLimiterGuard,
        {
          provide: APP_PIPE,
          useValue: new ValidationPipe({ whitelist: true, transform: true }),
        },
      ],
      exports: [PreviewMailService, 'PREVIEW_MAIL_OPTIONS'],
    };
  }
}
