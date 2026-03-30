import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PreviewMailOptions } from '../interfaces/preview-mail.interfaces';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(@Inject('PREVIEW_MAIL_OPTIONS') private options: PreviewMailOptions) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-previewmail-key'];
    
    if (!apiKey || apiKey !== this.options.apiKey) {
      throw new UnauthorizedException('Invalid or missing X-PreviewMail-Key header');
    }
    return true;
  }
}
