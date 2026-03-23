import { useEffect, useMemo } from "react";
import { clsx } from "clsx";
import { STARTER_LAYOUTS, type StarterLayout } from "@/lib/starterLayouts";
import { X, File, Layout, Palette, Receipt, Megaphone, LayoutTemplate } from "lucide-react";

interface LayoutStarterPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (starter: StarterLayout) => void;
}

const ICONS: Record<string, React.ElementType> = {
  blank: File,
  basic: Layout,
  branded: Palette,
  transactional: Receipt,
  marketing: Megaphone,
  minimal: LayoutTemplate,
};

export const LayoutStarterPicker = ({
  open,
  onClose,
  onSelect,
}: LayoutStarterPickerProps) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const starters = useMemo(() => STARTER_LAYOUTS, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-fg">New Layout</h2>
            <p className="mt-0.5 text-xs text-fg-muted">
              Choose a starter template
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 p-5">
          {starters.map((starter) => (
            <button
              key={starter.id}
              onClick={() => onSelect(starter)}
              className={clsx(
                "group flex flex-col items-start rounded-lg border border-border p-4 text-left transition-all",
                "hover:border-fg-faint hover:bg-bg-subtle",
              )}
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-bg-muted text-fg-muted transition-colors group-hover:bg-bg-inset group-hover:text-fg">
                {(() => {
                  const Icon = ICONS[starter.id] || File;
                  return <Icon className="h-4.5 w-4.5" />;
                })()}
              </div>
              <span className="text-[13px] font-medium text-fg">
                {starter.name}
              </span>
              <span className="mt-0.5 text-[11px] leading-snug text-fg-muted">
                {starter.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
