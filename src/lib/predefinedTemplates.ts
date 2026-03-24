/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PredefinedTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  htmlBody: string;
  mockData: Record<string, any>;
}

export const predefinedTemplates: PredefinedTemplate[] = [
  {
    id: "welcome-email-v1",
    name: "Welcome Email",
    description: "A clean and friendly welcome email to greet your new users.",
    subject: "Welcome to {{companyName}}! 🎉",
    mockData: {
      companyName: "Acme Corp",
      userName: "Jane Doe",
      actionUrl: "https://example.com/start",
    },
    htmlBody: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to {{companyName}}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background-color: #2563eb; padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 32px 24px; color: #3f3f46; font-size: 16px; line-height: 1.6; }
    .content p { margin-top: 0; margin-bottom: 24px; }
    .button-container { text-align: center; margin-top: 32px; margin-bottom: 16px; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .footer { background-color: #f8fafc; padding: 24px; text-align: center; color: #71717a; font-size: 13px; border-top: 1px solid #e4e4e7; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome aboard! 🚀</h1>
    </div>
    <div class="content">
      <p>Hi {{userName}},</p>
      <p>We're thrilled to have you here at <strong>{{companyName}}</strong>. We've built our platform to help you achieve your goals faster and easier than ever before.</p>
      <p>Click the button below to complete your profile and get started.</p>
      <div class="button-container">
        <a href="{{actionUrl}}" class="button">Get Started Now</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; 2025 {{companyName}}. All rights reserved.</p>
      <p>If you have any questions, reply back to this email.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: "password-reset-v1",
    name: "Password Reset",
    description: "Standard secure password reset notification template.",
    subject: "Reset your password for {{companyName}}",
    mockData: {
      companyName: "Acme Corp",
      userName: "Jane Doe",
      resetUrl: "https://example.com/reset-password",
    },
    htmlBody: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #eaeaea; }
    .header { padding: 24px; border-bottom: 1px solid #eaeaea; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; color: #111111; }
    .content { padding: 32px 24px; color: #444444; font-size: 15px; line-height: 1.6; }
    .button-container { text-align: center; margin: 32px 0; }
    .button { display: inline-block; background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 14px; }
    .footer { padding: 24px; background-color: #fafafa; text-align: center; color: #888888; border-top: 1px solid #eaeaea; font-size: 12px; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{companyName}}</h1>
    </div>
    <div class="content">
      <p>Hi {{userName}},</p>
      <p>We received a request to reset your password. You can reset it by clicking the button below:</p>
      <div class="button-container">
        <a href="{{resetUrl}}" class="button">Reset Password</a>
      </div>
      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
    </div>
    <div class="footer">
      <p>This password reset link will expire in 24 hours.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: "newsletter-v1",
    name: "Monthly Newsletter",
    description:
      "A feature-rich newsletter template to share updates and news.",
    subject: "Your Monthly Update - {{month}}",
    mockData: {
      month: "October 2025",
      title: "Exciting New Features!",
      readMoreUrl: "https://example.com/blog",
      articles: [
        {
          title: "New Dashboard Design",
          summary:
            "We've completely redesigned our dashboard for better analytics.",
        },
        {
          title: "Faster Exports",
          summary: "Exporting data is now 5x faster thanks to our new backend.",
        },
      ],
    },
    htmlBody: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Newsletter</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
    .container { max-width: 640px; margin: 40px auto; background-color: #ffffff; overflow: hidden; }
    .hero { background: linear-gradient(to right, #8b5cf6, #ec4899); padding: 48px 32px; text-align: center; color: #ffffff; }
    .hero h1 { margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
    .hero p { margin: 12px 0 0; font-size: 16px; opacity: 0.9; }
    .content { padding: 32px; color: #374151; font-size: 15px; line-height: 1.6; }
    .article { margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
    .article:last-child { border-bottom: none; }
    .article h3 { margin: 0 0 8px; color: #111827; font-size: 18px; }
    .article p { margin: 0 0 12px; color: #4b5563; }
    .read-more { display: inline-block; color: #8b5cf6; text-decoration: none; font-weight: 600; font-size: 14px; }
    .footer { background-color: #1f2937; padding: 32px; text-align: center; color: #9ca3af; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>{{title}}</h1>
      <p>The latest news and updates for {{month}}</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 32px;">Here's everything we've been working on this month to help you grow your business.</p>
      
      {{#each articles}}
      <div class="article">
        <h3>{{this.title}}</h3>
        <p>{{this.summary}}</p>
        <a href="{{../readMoreUrl}}" class="read-more">Read Full Story &rarr;</a>
      </div>
      {{/each}}
      
    </div>
    <div class="footer">
      <p>&copy; 2025 Our Company. All rights reserved.</p>
      <p>You are receiving this email because you opted in via our website.</p>
    </div>
  </div>
</body>
</html>`,
  },
];
