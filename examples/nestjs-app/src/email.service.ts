import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { PreviewMailService } from "@previewmail/nestjs";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import * as handlebars from "handlebars";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private sesClient: SESv2Client | null = null;
  private isConfigured = false;

  constructor(private readonly previewMailService: PreviewMailService) {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (region && accessKeyId && secretAccessKey) {
      this.sesClient = new SESv2Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.isConfigured = true;
    } else {
      this.logger.warn(
        "AWS SES credentials are not set in environment variables. Email sending will be a DRY RUN.",
      );
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<unknown> {
    const alias = "welcome-email";

    // 1. Fetch template from DB or Cache via PreviewMailService
    let template;
    try {
      template = await this.previewMailService.findByAlias(alias);
      if (!template) {
        // Fallback for demonstration if template doesn't exist yet
        template = {
          subject: "Welcome to PreviewMail, {{name}}!",
          htmlBody:
            "<h1>Welcome, {{name}}!</h1><p>We are glad to have you here.</p>",
          textBody: "Welcome, {{name}}! We are glad to have you.",
        };
        this.logger.warn(
          `Template '${alias}' not found in DB. Using fallback template.`,
        );
      }
    } catch (err) {
      this.logger.error(`Failed to fetch template '${alias}':`, err);
      throw new HttpException(
        "Failed to load email template",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 2. Compile with Handlebars
    const data = { name };
    const compiledSubject = handlebars.compile(template.subject)(data);
    const compiledHtml = handlebars.compile(template.htmlBody)(data);
    const compiledText = handlebars.compile(template.textBody || "")(data);

    // 3. Send via AWS SES
    if (!this.isConfigured || !this.sesClient) {
      this.logger.log(
        `[DRY RUN] Would send email to ${to} with subject: ${compiledSubject}`,
      );
      return {
        success: true,
        dryRun: true,
        message: `AWS Credentials not set. Simulated sending email to ${to}`,
        compiledSubject,
        compiledHtml,
      };
    }

    const command = new SendEmailCommand({
      FromEmailAddress:
        process.env.AWS_SES_FROM_ADDRESS || "noreply@yourdomain.com",
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: compiledSubject, Charset: "UTF-8" },
          Body: {
            Html: { Data: compiledHtml, Charset: "UTF-8" },
            Text: compiledText
              ? { Data: compiledText, Charset: "UTF-8" }
              : undefined,
          },
        },
      },
    });

    try {
      const result = await this.sesClient.send(command);
      this.logger.log(
        `Email sent successfully to ${to}. MessageId: ${result.MessageId}`,
      );
      return { success: true, messageId: result.MessageId };
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}:`, err);
      throw new HttpException(
        "Failed to send email via SES",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
