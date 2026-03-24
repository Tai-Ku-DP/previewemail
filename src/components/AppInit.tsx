import { useEffect } from "react";
import { useTemplateStore } from "@/stores/templateStore";
import { useLayoutStore } from "@/stores/layoutStore";

export function AppInit() {
  const { createLayout, updateLayout, loadLayouts } = useLayoutStore.getState();
  const { createTemplate, updateTemplate, loadTemplates } = useTemplateStore.getState();

  useEffect(() => {
    const initDefaults = async () => {
      const hasDefaults = localStorage.getItem("previewemail_defaults_created");
      if (hasDefaults) return;

      // Lock synchronously to prevent React StrictMode double-fire race condition
      localStorage.setItem("previewemail_defaults_created", "true");

      try {
        // 1. Create Default Layout
        const layout = await createLayout("Base Layout", `base-layout-${Date.now()}`);
        await updateLayout(layout.id, {
          htmlBody: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px; }
    .email-wrapper { max-width: 600px; margin: 0 auto; }
    .email-header { padding-bottom: 24px; text-align: center; }
    .container { background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #f3f4f6; }
    .content-area { padding: 40px; }
    .footer { text-align: center; padding: 32px 20px; font-size: 13px; color: #6b7280; line-height: 1.5; }
    .footer a { color: #9ca3af; text-decoration: none; margin: 0 8px; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <h2 style="margin:0; font-weight:700; color:#111827; letter-spacing:-0.5px;">PreviewEmail</h2>
    </div>
    <div class="container">
      <div class="content-area">
        {{{@content}}}
      </div>
    </div>
    <div class="footer">
      <div>&copy; 2026 Your Company. All rights reserved.</div>
      <div style="margin-top: 8px;">
        <a href="#">Preferences</a> &bull; <a href="#">Unsubscribe</a> &bull; <a href="#">Privacy Policy</a>
      </div>
    </div>
  </div>
</body>
</html>`,
        });

        // 2. Create Welcome Template using the Layout
        const template = await createTemplate("Welcome Email", `welcome-invite-${Date.now()}`);
        
        const cleanContent = `
<div style="text-align: center;">
  <div style="display:inline-flex; align-items:center; justify-content:center; width:64px; height:64px; border-radius:32px; background-color:#f0fdf4; color:#16a34a; margin-bottom:24px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"></path><path d="M22 4L12 14.01l-3-3"></path></svg>
  </div>
  <h1 style="color: #111827; margin: 0 0 16px; font-size:28px; font-weight:800; letter-spacing:-0.5px;">Welcome to the family, {{name}}!</h1>
  <p style="color: #4b5563; line-height: 1.6; font-size:16px; margin: 0 0 32px;">
    We're absolutely thrilled to have you on board. You've just unlocked a world of possibilities, and we can't wait to see what you build.
  </p>
  <a href="{{actionUrl}}" style="display: inline-block; padding: 14px 28px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.4);">
    Explore your Dashboard
  </a>
</div>
`;

        await updateTemplate(template.id, {
          layoutId: layout.id,
          subject: "Welcome to our platform, {{name}}!",
          htmlBody: cleanContent.trim(),
          mockData: { name: "Alex", actionUrl: "https://example.com" },
        });

        // Reload stores to ensure UI has latest data
        await loadLayouts();
        await loadTemplates();
      } catch (err) {
        localStorage.removeItem("previewemail_defaults_created");
        console.error("Failed to inject defaults", err);
      }
    };

    void initDefaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
