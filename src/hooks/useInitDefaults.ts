// hooks/useInitDefaults.ts
import { useEffect } from "react";
import { useLayoutStore } from "@/stores/layoutStore";
import { useTemplateStore } from "@/stores/templateStore";
import { DEFAULT_LAYOUTS, DEFAULT_TEMPLATES } from "@/lib/defaults.config";

const STORAGE_KEY = "previewemail_defaults_created";

export function useInitDefaults() {
  useEffect(() => {
    const initDefaults = async () => {
      if (localStorage.getItem(STORAGE_KEY)) return;
      localStorage.setItem(STORAGE_KEY, "true");

      const { createLayout, updateLayout, loadLayouts } =
        useLayoutStore.getState();
      const { createTemplate, updateTemplate, loadTemplates } =
        useTemplateStore.getState();

      try {
        // 1. Tạo tất cả layouts, lưu map key → id
        const layoutIdMap: Record<string, string> = {};

        for (const config of DEFAULT_LAYOUTS) {
          const layout = await createLayout(
            config.name,
            `${config.key}-${Date.now()}`,
          );
          await updateLayout(layout.id, { htmlBody: config.htmlBody });
          layoutIdMap[config.key] = layout.id;
        }

        // 2. Tạo tất cả templates, resolve layoutId từ map
        for (const config of DEFAULT_TEMPLATES) {
          const template = await createTemplate(
            config.name,
            `${config.key}-${Date.now()}`,
          );
          await updateTemplate(template.id, {
            layoutId: config.layoutKey
              ? layoutIdMap[config.layoutKey]
              : undefined,
            subject: config.subject,
            htmlBody: config.htmlBody,
            mockData: config.mockData,
          });
        }

        await Promise.all([loadLayouts(), loadTemplates()]);
      } catch (err) {
        localStorage.removeItem(STORAGE_KEY);
        console.error("Failed to inject defaults", err);
      }
    };

    void initDefaults();
  }, []);
}
