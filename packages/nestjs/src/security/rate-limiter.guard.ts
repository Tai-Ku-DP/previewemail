import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { PreviewMailOptions } from '../interfaces/preview-mail.interfaces';

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private ipRequests = new Map<string, { count: number, resetTime: number }>();

  constructor(@Inject('PREVIEW_MAIL_OPTIONS') private options: PreviewMailOptions) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.options.rateLimit) return true;

    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = this.options.rateLimit.windowMs;
    const max = this.options.rateLimit.max;

    let record = this.ipRequests.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
    } else {
      record.count++;
      if (record.count > max) {
        throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    this.ipRequests.set(ip, record);
    return true;
  }
}
