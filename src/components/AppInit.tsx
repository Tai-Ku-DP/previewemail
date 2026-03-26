// components/AppInit.tsx  ← gọn lại hoàn toàn
import { useInitDefaults } from "@/hooks/useInitDefaults";

export function AppInit() {
  useInitDefaults();
  return null;
}
