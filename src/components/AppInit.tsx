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

      try {
        // 1. Create Default Layout
        const layout = await createLayout("Base Layout", `base-layout-${Date.now()}`);
        await updateLayout(layout.id, {
          htmlBody: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #71717a; }
  </style>
</head>
<body>
  <div class="container">
    {{{@content}}}
  </div>
  <div class="footer">
    &copy; 2026 Your Company. All rights reserved.
  </div>
</body>
</html>`,
        });

        // 2. Create Welcome Template using the Layout
        const template = await createTemplate("Welcome Email", `welcome-invite-${Date.now()}`);
        
        const cleanContent = `
<div style="padding: 40px; text-align: center;">
  <h1 style="color: #18181b; margin-top: 0;">Welcome, {{name}}! 👋</h1>
  <p style="color: #52525b; line-height: 1.6;">We're thrilled to have you on board. Get ready to explore all the amazing features we've built for you.</p>
  <a href="{{actionUrl}}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Get Started</a>
</div>
`;

        await updateTemplate(template.id, {
          layoutId: layout.id,
          subject: "Welcome to our platform, {{name}}!",
          htmlBody: cleanContent.trim(),
          mockData: { name: "Alex", actionUrl: "https://example.com" },
        });

        localStorage.setItem("previewemail_defaults_created", "true");
        // Reload stores to ensure UI has latest data
        await loadLayouts();
        await loadTemplates();
      } catch (err) {
        console.error("Failed to inject defaults", err);
      }
    };

    void initDefaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
