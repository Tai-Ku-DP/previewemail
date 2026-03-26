export interface LayoutConfig {
  key: string;
  name: string;
  htmlBody: string;
}

export interface TemplateConfig {
  key: string;
  name: string;
  layoutKey?: string;
  subject: string;
  htmlBody: string;
  mockData?: Record<string, unknown>;
}

export const DEFAULT_LAYOUTS: LayoutConfig[] = [
  {
    key: "base-layout",
    name: "Base Layout",
    htmlBody: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title></title>
    
        <style type="text/css" rel="stylesheet" media="all">
          body {
            background-color: #ffffff;
          }

         .gmail-blend-screen {
          background: #000;
          mix-blend-mode: screen;
         }

    
          .previewmail-mail {
            line-height: 1.5;
            min-width: 348px;
            background: #f9fafb;
            font-family: Roboto-Regular, Helvetica, Arial, sans-serif;
          }
    
          /* Button */

         a.text-decoration {
          text-decoration:underline;
          color: #f37f26;
         }

        a,
        a.link {
          text-decoration: none;
          color: #f37f26;
        }

          a.btn {
          display: block;
          height: 40px;
          padding: 0px 16px;
          border-radius: 8px;

        background: #f37f26;
        background-image: linear-gradient(#f37f26, #f37f26);
        color: #fff !important;

        text-decoration: none;
        text-align: center;
        font-weight: 600;
        line-height: 40px;
          }

        a.btn-small {
        text-decoration: none;
        color: #F37F26!important;
        display: block;
        height: 24px;
        padding: 0 16px;
        border-radius: 4px;
        background: #FFFFFF;
        text-align: center;
        font-size: 14px;
        line-height: 24px;
        border: 1px solid #F37F26;
      }
    
       a.btn-small.btn-outline {
        display: block;
        border: 1px solid #f37f26;
        background: #fff;
        color: #f37f26;
      }
      
      a.btn.btn-outline {
        display: block;
        border: 1px solid #f37f26;
        background: #fff;
        color: #f37f26;
      }
    
          /* Typography */
          strong {
            font-weight: 600;
          }
    
          /* Table */
          table {
            border-spacing: 0;
            border-collapse: collapse;
          }
    
          table.full-width {
            width: 100%;
          }
    
          .container {
            width: 600px;
            max-width: 600px;
          }
    
          /* Header */
          .header {
            padding: 16px 16px;
            border-radius: 8px 8px 0 0;
            background: #fafbfb;
            border-bottom: 1px solid #eeeeee;
          }
    
          .header a {
            text-decoration: none;
            color: #000;
          }
    
          .header table td {
            padding: 0;
          }
    
          .header .previewmail-logo img {
            display: block;
            max-height: 36px;
            height: auto;
            width: auto;
            max-width: 100%;
          }
    
          .header .previewmail-logo {
            display: table-cell;
            align-self: center;
          }
    
          .header .company-name-mobile {
            display: none;
            margin-top: 8px;
            font-size: 18px;
            line-height: normal;
            color: #000;
          }
    
          .header .company-name-desktop {
            display: flex;
            align-items: center;
            font-size: 18px;
            text-wrap: nowrap;
            line-height: normal;
            color: #000;
          }
    
          .teamName {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
    
          /* Body */
          .body {
            padding: 24px 16px;
            background: #fff;
          }
    
          /* Footer */
          .footer {
            background: #fafbfb;
            padding: 12px 16px;
            border-top: 1px solid #eee;
            border-radius: 0 0 8px 8px;
            color: #888;
          }
    
          .footer .copyright {
            display: block;
            display: -webkit-box;
            font-size: 12px;
            max-width: 100%;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #9ca3af;
          }
    
          .previewmail-regards {
            margin-bottom: 0 !important;
          }
    
          .previewmail-team {
            margin-top:0 !important;
            margin-bottom: 0 !important;
            font-weight: 600;
          }
    
          /* Workspace */
          .workspace-domain {
            text-align: center;
            background-color: #fafbfb;
            padding: 8px;
            border: 1px solid #dfdfdf;
            border-radius: 8px;
            line-height: normal;
            font-size: 18px;
            margin-bottom: 0;
          }
    
          .previewmail-td {
            padding: 16px 8px;
          }
    
          @media screen and (max-width: 599px) {
            .container {
              width: 100% !important;
              max-width: 100% !important;
            }
    
            .previewmail-td {
              padding: 0px;
            }
    
            .header,
            .body,
            .footer {
              padding: 24px;
            }
    
            .header .company-name-mobile {
              display: block;
            }
    
            .header .company-name-desktop {
              display: none;
            }
          }
        </style>
      </head>
      <body style="padding: 0; margin: 0">
        <table class="previewmail-mail full-width">
          <tr>
            <td class="previewmail-td">
              <div
                class="container full-width"
                style="
                  margin-left: auto;
                  margin-right: auto;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                "
              >
                <table class="full-width">
                  <tr>
                    <td class="header">
                      <table class="full-width">
                        <tr>
                          <td style="width: 33%">
                            <a href="{{website}}" target="_blank" class="previewmail-logo">
                              <img src="{{logo}}" alt="previewmail.com" />
                            </a>
                            <div class="company-name-mobile">
                              <strong>{{companyName}}</strong>
                            </div>
                          </td>
                          <td style="width: 20%"></td>
                          <td style="width: text">
                            <div style="float: right">
                              <div class="company-name-desktop">
                                <strong class="teamName">{{companyName}}</strong>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td class="body">
                      {{{@content}}}
                      <p class="previewmail-regards">Regards,</p>
                      <p class="previewmail-team">PreviewMail Team.</p>
                    </td>
                  </tr>
                  <tr>
                    <td class="footer">
                      <table class="full-width">
                        <tr>
                          <td style="width: 33%">
                            <span class="copyright">© 2021–{{currentYear}} Powered by PreviewMail®</span>
                          </td>
                          <td style="width: 5%"></td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>`,
  },
];

export const DEFAULT_TEMPLATES: TemplateConfig[] = [
  {
    key: "welcome-email",
    name: "Welcome Email",
    layoutKey: "base-layout",
    subject: "Welcome to our platform",
    htmlBody: `
            <strong>Hi {{fullName}}, 👋</strong>
          
            <div style="margin-top: 16px; margin-bottom: 16px">
              <p class="workspace-domain">
                 <a href="https://{{tenantKey}}.{{baseDomain}}" target="_blank" class="link">
                    <strong>{{tenantKey}}</strong>.{{baseDomain}}
                 </a>
              </p>
            </div>
            
            <p>Hey! You joined your team and ours, let grow your business now! With Simplamo you can:</p>
            <ul>
              <li style="line-height: 22px">Write & preview instantly — see your email render in real-time as you type, no deploy needed</li>
              <li style="line-height: 22px">Mock your variables — paste JSON, see variables replaced with real data immediately</li>
              <li style="line-height: 22px">Manage all templates in one place — no account, no server, everything saved locally in your browser</li>
            </ul>
            <p>
              All this to help to integrate your data, opportunities, issues, processes, and people to achieve your short and long term goals while accelerating your vision.
            </p>
            
            <p>
              Now go back to PreviewMail and build better emails faster."
            </p>

            <div style="display: flex; justify-content: center;margin-bottom: 16px;">
             <a href="{{callback}}" class="btn">
                <span class="gmail-blend-screen">
                   <span class="gmail-blend-difference"> Activate Now </span>
                </span>
             </a>
            </div>

            <div style="margin-top: 16px; margin-bottom: 16px;">
               <div style="margin-top: 4px; margin-bottom: 4px;">Or copy and paste this link into your browser:</div>
               <a href="https://{{tenantKey}}.{{baseDomain}}" style="word-break: break-all;">https://{{tenantKey}}.{{baseDomain}}</a>
            </div>
          
            <div style="margin-top: 16px; margin-bottom: 16px;">
            <div style="margin-top: 4px; margin-bottom: 4px;">If you did not create a PreviewMail account, please kindly contact us at</div>
               <a style="word-break: break-all;">support@previewmail.com</a>
            </div>
    `,
    mockData: {
      companyName: "TTech",
      fullName: "John Doe",
      tenantKey: "ttech",
      baseDomain: "previewmail.com",
      callback: "https://ttech.previewmail.com",
      logo: "https://simplamo.s3.ap-southeast-1.amazonaws.com/core/39636762-f8c4-43cc-a5b5-3f46ea745672.webp",
    },
  },
  {
    key: "login-with-email",
    name: "Login Email",
    layoutKey: "base-layout", // ← reference theo key, không phải id
    subject: "Your login code: {{digitCode}}",
    htmlBody: `<div style="margin-top: 16px; margin-bottom: 16px">
    <a
      class="text-decoration"
      href="{{callback}}"
      style="word-break: break-all; margin-top: 8px; margin-bottom: 8px"
      >Click here to log in to the system</a
    >
    <div style="margin-top: 8px; margin-bottom: 8px; color: #000">
      Or copy and paste this login code below:
    </div>
  </div>
  <p class="workspace-domain">{{digitCode}}</p>
  <div style="margin-top: 16px; margin-bottom: 16px">
    <div style="margin-top: 8px; margin-bottom: 8px; color: #000">
      If you did not create PreviewMail account, please kindly contact us at
    </div>
    <a href="mailto:support@previewmail.com" class="link"
      ><span
        class="__cf_email__"
        data-cfemail="26555356564954526652544745524f49485149544d0845494b"
        >support@previewmail.com</span
      ></a
    >
  </div>
  `,
    mockData: {
      mockData: {
        name: "Alex",
        actionUrl: "https://example.com",
        website: "website_Value",
        logo: "https://simplamo.s3.ap-southeast-1.amazonaws.com/core/39636762-f8c4-43cc-a5b5-3f46ea745672.webp",
        currentYear: "2025",
        callback: "callback_Value",
        digitCode: "113119",
      },
    },
  },
];
