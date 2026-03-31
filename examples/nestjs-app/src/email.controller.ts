import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test-send')
  async sendTestEmail(
    @Body('to') to: string,
    @Body('name') name: string,
  ) {
    if (!to || !name) {
      throw new BadRequestException("Missing 'to' or 'name' in request body");
    }
    return this.emailService.sendWelcomeEmail(to, name);
  }
}
