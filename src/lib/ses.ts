import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { SESSettings } from "@/types";

interface SendTestParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  settings: SESSettings;
}

export async function sendTestEmail(params: SendTestParams): Promise<void> {
  const client = new SESv2Client({
    region: params.settings.region,
    credentials: {
      accessKeyId: params.settings.accessKeyId,
      secretAccessKey: params.settings.secretAccessKey,
    },
  });

  const command = new SendEmailCommand({
    FromEmailAddress: params.settings.fromAddress,
    Destination: { ToAddresses: [params.to] },
    Content: {
      Simple: {
        Subject: { Data: params.subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: params.html, Charset: "UTF-8" },
          Text: { Data: params.text, Charset: "UTF-8" },
        },
      },
    },
  });

  await client.send(command);
}
