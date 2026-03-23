import { useEditorStore } from "@/stores/editorStore";
import { MockDataEditor } from "@/mockdata/MockDataEditor";
import { clsx } from "clsx";
import { Monitor, Smartphone } from "lucide-react";
import type { RightPanelTab, PreviewWidth } from "@/types";

interface PreviewPanelProps {
  compiledHtml: string;
  compiledSubject: string;
  compileError: string | null;
  mockDataJson: string;
  htmlBody: string;
  onMockDataChange: (value: string) => void;
  mockDataError: string | null;
}

const TABS: { key: RightPanelTab; label: string }[] = [
  { key: "preview", label: "Preview" },
  { key: "mockdata", label: "Mock Data" },
];

const WIDTHS: { value: PreviewWidth; icon: "desktop" | "mobile" }[] = [
  { value: 600, icon: "desktop" },
  { value: 375, icon: "mobile" },
];

export const PreviewPanel = ({
  compiledHtml,
  compiledSubject,
  compileError,
  mockDataJson,
  htmlBody,
  onMockDataChange,
  mockDataError,
}: PreviewPanelProps) => {
  const { rightPanelTab, setRightPanelTab, previewWidth, setPreviewWidth } =
    useEditorStore();

  return (
    <div className="flex h-full flex-col bg-bg-subtle">
      <div className="flex h-10 items-end justify-between border-b border-border bg-bg px-2">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRightPanelTab(tab.key)}
              className={clsx(
                "relative h-10 px-3 text-[13px] font-medium transition-colors",
                rightPanelTab === tab.key
                  ? "text-fg after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-fg"
                  : "text-fg-muted hover:text-fg-secondary",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {rightPanelTab === "preview" && (
          <div className="mb-1.5 mr-1 flex items-center gap-0.5 rounded-md border border-border p-0.5">
            {WIDTHS.map((w) => (
              <button
                key={w.value}
                onClick={() => setPreviewWidth(w.value)}
                className={clsx(
                  "inline-flex h-6 w-6 items-center justify-center rounded transition-colors",
                  previewWidth === w.value
                    ? "bg-bg-muted text-fg"
                    : "text-fg-muted hover:text-fg-secondary",
                )}
                aria-label={`${w.icon} preview width`}
              >
                {w.icon === "desktop" ? (
                  <Monitor className="h-3.5 w-3.5" />
                ) : (
                  <Smartphone className="h-3.5 w-3.5" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {rightPanelTab === "preview" ? (
        <div className="min-h-0 flex-1 overflow-auto bg-bg-subtle p-4">
          {compiledSubject && (
            <div className="mb-3 rounded-lg border border-border bg-bg px-3 py-2">
              <span className="text-[11px] font-medium text-fg-muted">
                Subject
              </span>
              <p className="mt-0.5 text-[13px] text-fg">{compiledSubject}</p>
            </div>
          )}

          {compileError && (
            <div className="mb-3 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[13px] text-danger">
              {compileError}
            </div>
          )}

          <div
            className="mx-auto overflow-hidden rounded-lg border border-border bg-white shadow-sm transition-all"
            style={{ width: previewWidth, maxWidth: "100%" }}
          >
            <iframe
              srcDoc={compiledHtml ?? ""}
              sandbox="allow-same-origin"
              title="Email Preview"
              className="h-full w-full border-0"
              style={{ width: previewWidth }}
            />
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <MockDataEditor
            value={mockDataJson}
            htmlBody={htmlBody}
            onChange={onMockDataChange}
            error={mockDataError}
          />
        </div>
      )}
    </div>
  );
};
