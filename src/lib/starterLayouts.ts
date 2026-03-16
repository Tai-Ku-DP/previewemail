export interface StarterLayout {
  id: string;
  name: string;
  description: string;
  htmlBody: string;
  textBody: string;
}

export const STARTER_LAYOUTS: StarterLayout[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Empty layout — start from scratch',
    htmlBody: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  {{{@content}}}
</body>
</html>`,
    textBody: '{{{@content}}}',
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'Centered container with clean typography',
    htmlBody: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { width: 100%; background-color: #f4f4f5; padding: 32px 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
    .content { padding: 32px 40px; color: #27272a; font-size: 15px; line-height: 1.6; }
    .footer { padding: 24px 40px; text-align: center; font-size: 12px; color: #a1a1aa; }
    .footer a { color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="content">
        {{{@content}}}
      </div>
      <div class="footer">
        <p>&copy; {{year}} {{company_name}}. All rights reserved.</p>
        <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
      </div>
    </div>
  </div>
</body>
</html>`,
    textBody: `{{{@content}}}

---
© {{year}} {{company_name}}. All rights reserved.
Unsubscribe: {{unsubscribe_url}}`,
  },
  {
    id: 'branded',
    name: 'Branded',
    description: 'Logo header, content area, and branded footer',
    htmlBody: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { width: 100%; background-color: #f4f4f5; padding: 32px 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e4e4e7; }
    .header { padding: 24px 40px; border-bottom: 1px solid #f4f4f5; }
    .logo { font-size: 18px; font-weight: 700; color: #09090b; text-decoration: none; }
    .content { padding: 32px 40px; color: #27272a; font-size: 15px; line-height: 1.6; }
    .footer { padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #f4f4f5; }
    .footer-links { text-align: center; margin-bottom: 16px; }
    .footer-links a { color: #52525b; text-decoration: none; font-size: 13px; margin: 0 12px; }
    .footer-links a:hover { text-decoration: underline; }
    .footer-meta { text-align: center; font-size: 12px; color: #a1a1aa; line-height: 1.5; }
    .footer-meta a { color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="{{website_url}}" class="logo">{{company_name}}</a>
      </div>
      <div class="content">
        {{{@content}}}
      </div>
      <div class="footer">
        <div class="footer-links">
          <a href="{{website_url}}">Website</a>
          <a href="{{help_url}}">Help Center</a>
          <a href="{{privacy_url}}">Privacy</a>
        </div>
        <div class="footer-meta">
          <p>{{company_name}} &middot; {{company_address}}</p>
          <p><a href="{{unsubscribe_url}}">Unsubscribe</a> from these emails</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
    textBody: `{{company_name}}
===

{{{@content}}}

---
Website: {{website_url}}
Help Center: {{help_url}}

{{company_name}} · {{company_address}}
Unsubscribe: {{unsubscribe_url}}`,
  },
  {
    id: 'transactional',
    name: 'Transactional',
    description: 'Clean layout for receipts, alerts, and notifications',
    htmlBody: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { width: 100%; padding: 40px 0; }
    .container { max-width: 560px; margin: 0 auto; padding: 0 20px; }
    .header { padding-bottom: 24px; border-bottom: 1px solid #e4e4e7; margin-bottom: 24px; }
    .logo { font-size: 16px; font-weight: 600; color: #09090b; text-decoration: none; }
    .content { color: #27272a; font-size: 15px; line-height: 1.7; }
    .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7; font-size: 12px; color: #a1a1aa; line-height: 1.5; }
    .footer a { color: #71717a; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="{{website_url}}" class="logo">{{company_name}}</a>
      </div>
      <div class="content">
        {{{@content}}}
      </div>
      <div class="footer">
        <p>This is an automated message from {{company_name}}. Please do not reply directly to this email.</p>
        <p>{{company_name}} &middot; {{company_address}}</p>
      </div>
    </div>
  </div>
</body>
</html>`,
    textBody: `{{company_name}}

{{{@content}}}

---
This is an automated message from {{company_name}}.
{{company_name}} · {{company_address}}`,
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Hero section, content blocks, CTA, and social footer',
    htmlBody: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { width: 100%; background-color: #f4f4f5; padding: 32px 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e4e4e7; }
    .header { padding: 20px 40px; text-align: center; border-bottom: 1px solid #f4f4f5; }
    .logo { font-size: 18px; font-weight: 700; color: #09090b; text-decoration: none; }
    .hero { background-color: #09090b; padding: 48px 40px; text-align: center; }
    .hero h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin: 0 0 12px; line-height: 1.3; }
    .hero p { color: #a1a1aa; font-size: 15px; margin: 0; line-height: 1.5; }
    .content { padding: 32px 40px; color: #27272a; font-size: 15px; line-height: 1.6; }
    .btn { display: inline-block; padding: 12px 28px; background-color: #09090b; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; }
    .footer { padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #f4f4f5; text-align: center; }
    .social { margin-bottom: 16px; }
    .social a { display: inline-block; margin: 0 8px; color: #71717a; text-decoration: none; font-size: 13px; }
    .social a:hover { color: #09090b; }
    .footer-meta { font-size: 12px; color: #a1a1aa; line-height: 1.5; }
    .footer-meta a { color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="{{website_url}}" class="logo">{{company_name}}</a>
      </div>
      <div class="hero">
        <h1>{{hero_title}}</h1>
        <p>{{hero_subtitle}}</p>
      </div>
      <div class="content">
        {{{@content}}}
      </div>
      <div class="footer">
        <div class="social">
          <a href="{{twitter_url}}">Twitter</a>
          <a href="{{linkedin_url}}">LinkedIn</a>
          <a href="{{website_url}}">Website</a>
        </div>
        <div class="footer-meta">
          <p>{{company_name}} &middot; {{company_address}}</p>
          <p><a href="{{unsubscribe_url}}">Unsubscribe</a> &middot; <a href="{{preferences_url}}">Email preferences</a></p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
    textBody: `{{company_name}}

# {{hero_title}}
{{hero_subtitle}}

{{{@content}}}

---
Twitter: {{twitter_url}}
LinkedIn: {{linkedin_url}}
Website: {{website_url}}

{{company_name}} · {{company_address}}
Unsubscribe: {{unsubscribe_url}}
Email preferences: {{preferences_url}}`,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Text-only, no frills — like a personal email',
    htmlBody: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #ffffff; font-family: Georgia, 'Times New Roman', serif; }
    .wrapper { max-width: 520px; margin: 0 auto; padding: 40px 20px; }
    .content { color: #27272a; font-size: 16px; line-height: 1.7; }
    .content p { margin: 0 0 16px; }
    .signature { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e4e4e7; font-size: 14px; color: #71717a; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="content">
      {{{@content}}}
    </div>
    <div class="signature">
      <p>{{sender_name}}<br>{{company_name}}</p>
    </div>
  </div>
</body>
</html>`,
    textBody: `{{{@content}}}

--
{{sender_name}}
{{company_name}}`,
  },
];
