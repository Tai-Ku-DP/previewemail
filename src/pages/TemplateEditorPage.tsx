import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { clsx } from "clsx";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SettingsModal } from "@/components/SettingsModal";
import { SendTestModal } from "@/components/SendTestModal";
import { EditorPanel } from "@/editor/EditorPanel";
import { MockDataEditor } from "@/mockdata/MockDataEditor";
import { useTemplates } from "@/hooks/useTemplates";
import { useLayouts } from "@/hooks/useLayouts";
import { useMockData } from "@/hooks/useMockData";
import { usePreview } from "@/hooks/usePreview";
import { useSettings } from "@/hooks/useSettings";
import { useEditorStore } from "@/stores/editorStore";
import { formatHtml, formatJson } from "@/lib/formatter";
import { buildMockDataSkeleton } from "@/lib/handlebars";
import type { Layout } from "@/types";

export default function TemplateEditorPage() {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();

  const { templates, selectedTemplate, selectTemplate, updateTemplate } =
    useTemplates();

  const { layouts, getLayoutById } = useLayouts();

  const templateEditorMainTab = useEditorStore((s) => s.templateEditorMainTab);
  const setTemplateEditorMainTab = useEditorStore(
    (s) => s.setTemplateEditorMainTab,
  );
  const toggleTemplateEditorMainTab = useEditorStore(
    (s) => s.toggleTemplateEditorMainTab,
  );
  const editorMaximized = useEditorStore((s) => s.editorMaximized);
  const previewMockDataOpen = useEditorStore((s) => s.previewMockDataOpen);
  const togglePreviewMockData = useEditorStore((s) => s.togglePreviewMockData);
  const previewSplit = useEditorStore((s) => s.previewSplit);
  const setPreviewSplit = useEditorStore((s) => s.setPreviewSplit);
  const rightPanelTab = useEditorStore((s) => s.rightPanelTab);
  const isDirty = useEditorStore((s) => s.isDirty);
  const setDirty = useEditorStore((s) => s.setDirty);
  const {
    settings,
    isConfigured,
    save: saveSettings,
    clear: clearSettings,
  } = useSettings();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sendTestOpen, setSendTestOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const previewSplitRef = useRef<HTMLDivElement | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Template editing state
  const [htmlBody, setHtmlBody] = useState("");
  const [textBody, setTextBody] = useState("");
  const [subject, setSubject] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateLayoutId, setTemplateLayoutId] = useState<string | null>(null);
  const [mockDataJson, setMockDataJson] = useState("{}");

  const { mockData, parseError, updateFromJson, reset } = useMockData();

  useEffect(() => {
    if (!templateId) return;
    selectTemplate(templateId);
  }, [templateId, selectTemplate]);

  // Sync template state when selection changes
  useEffect(() => {
    if (!selectedTemplate) return;
    queueMicrotask(() => {
      setHtmlBody(selectedTemplate.htmlBody);
      setTextBody(selectedTemplate.textBody);
      setSubject(selectedTemplate.subject);
      setTemplateName(selectedTemplate.name);
      setTemplateLayoutId(selectedTemplate.layoutId);
      const json = JSON.stringify(selectedTemplate.mockData, null, 2);
      setMockDataJson(json);
      reset(selectedTemplate.mockData);
      setDirty(false);
    });
  }, [selectedTemplate, reset, setDirty]);

  const activeLayout: Layout | undefined = useMemo(() => {
    if (templateLayoutId) return getLayoutById(templateLayoutId);
    return undefined;
  }, [templateLayoutId, getLayoutById]);

  const { renderedHtml, compileError, compiledSubject } = usePreview(
    htmlBody,
    subject,
    mockData,
    activeLayout?.htmlBody,
  );

  const handleMockDataChange = useCallback(
    (value: string) => {
      setMockDataJson(value);
      updateFromJson(value);
      setDirty(true);
    },
    [updateFromJson, setDirty],
  );

  useEffect(() => {
    if (templateEditorMainTab !== "preview") return;

    const isPlainObject = (v: unknown): v is Record<string, unknown> =>
      typeof v === "object" && v !== null && !Array.isArray(v);

    const mergeDeep = (
      target: Record<string, unknown>,
      source: Record<string, unknown>,
    ) => {
      for (const [k, v] of Object.entries(source)) {
        const existing = target[k];
        if (Array.isArray(v)) {
          if (!Array.isArray(existing) || existing.length === 0) {
            target[k] = v;
          } else if (isPlainObject(v[0]) && isPlainObject(existing[0])) {
            mergeDeep(
              existing[0] as Record<string, unknown>,
              v[0] as Record<string, unknown>,
            );
          }
        } else if (isPlainObject(v)) {
          if (!isPlainObject(existing)) target[k] = {};
          mergeDeep(target[k] as Record<string, unknown>, v);
        } else {
          if (!(k in target)) target[k] = v;
        }
      }
    };

    let current: Record<string, unknown> = {};
    try {
      current = JSON.parse(mockDataJson) as Record<string, unknown>;
    } catch {
      current = {};
    }

    const filled: Record<string, unknown> = { ...current };
    const skeleton = buildMockDataSkeleton(htmlBody);
    mergeDeep(filled, skeleton);
    const nextJson = JSON.stringify(filled, null, 2);
    if (nextJson !== mockDataJson) {
      queueMicrotask(() => {
        setMockDataJson(nextJson);
        updateFromJson(nextJson);
      });
    }
  }, [templateEditorMainTab, htmlBody, mockDataJson, updateFromJson]);

  const handleSaveTemplate = useCallback(async (overrides?: {
    htmlBody?: string;
    mockData?: Record<string, unknown>;
    mockDataJson?: string;
  }) => {
    if (!selectedTemplate) return;
    try {
      const nextHtmlBody = overrides?.htmlBody ?? htmlBody;
      const nextMockData = overrides?.mockData ?? mockData;
      await updateTemplate(selectedTemplate.id, {
        name: templateName,
        htmlBody: nextHtmlBody,
        textBody,
        subject,
        layoutId: templateLayoutId,
        mockData: nextMockData,
      });
      if (overrides?.htmlBody && overrides.htmlBody !== htmlBody) {
        setHtmlBody(overrides.htmlBody);
      }
      if (overrides?.mockDataJson && overrides.mockDataJson !== mockDataJson) {
        setMockDataJson(overrides.mockDataJson);
        updateFromJson(overrides.mockDataJson);
      }
      toast.success("Template saved");
      setDirty(false);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2000);
    } catch {
      toast.error("Failed to save template");
    }
  }, [
    selectedTemplate,
    templateName,
    htmlBody,
    textBody,
    subject,
    templateLayoutId,
    mockData,
    updateTemplate,
    setDirty,
    mockDataJson,
    updateFromJson,
  ]);

  useEffect(() => {
    if (!isDirty || rightPanelTab === "mockdata") {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
      return;
    }

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      void handleSaveTemplate();
    }, 4000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    };
  }, [
    isDirty,
    rightPanelTab,
    handleSaveTemplate,
    htmlBody,
    textBody,
    subject,
    templateName,
    templateLayoutId,
    mockDataJson,
  ]);

  const handleSendTest = useCallback(() => {
    if (!isConfigured) return;
    if (!renderedHtml) {
      toast.error("Template body is empty");
      return;
    }
    setSendTestOpen(true);
  }, [isConfigured, renderedHtml]);

  const formatInProgress = useRef(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && useEditorStore.getState().editorMaximized) {
        e.preventDefault();
        useEditorStore.getState().setEditorMaximized(false);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (formatInProgress.current) return;
        formatInProgress.current = true;

        const editorTab = useEditorStore.getState().editorTab;
        const rightTab = useEditorStore.getState().rightPanelTab;

        const save = async () => {
          if (rightTab === "mockdata") {
            try {
              const formattedJson = formatJson(mockDataJson);
              const parsed = JSON.parse(formattedJson) as Record<string, unknown>;
              await handleSaveTemplate({
                mockData: parsed,
                mockDataJson: formattedJson,
              });
            } catch {
              await handleSaveTemplate();
            }
            return;
          }

          if (editorTab === "html" && htmlBody.trim()) {
            try {
              const formattedHtml = await formatHtml(htmlBody);
              await handleSaveTemplate({ htmlBody: formattedHtml });
            } catch {
              await handleSaveTemplate();
            }
            return;
          }

          await handleSaveTemplate();
        };

        void save().finally(() => {
          formatInProgress.current = false;
        });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        toggleTemplateEditorMainTab();
      }
      if (e.shiftKey && e.altKey && e.key === "F") {
        e.preventDefault();
        if (formatInProgress.current) return;
        formatInProgress.current = true;

        const editorTab = useEditorStore.getState().editorTab;
        const rightTab = useEditorStore.getState().rightPanelTab;

        if (rightTab === "mockdata") {
          try {
            const formatted = formatJson(mockDataJson);
            handleMockDataChange(formatted);
            toast.success("JSON formatted");
          } catch {
            toast.error("Cannot format invalid JSON");
          }
          formatInProgress.current = false;
        } else if (editorTab === "html") {
          void formatHtml(htmlBody)
            .then((formatted) => {
              setHtmlBody(formatted);
              toast.success("HTML formatted");
            })
            .catch(() => toast.error("Format failed — check Handlebars syntax"))
            .finally(() => {
              formatInProgress.current = false;
            });
        } else {
          formatInProgress.current = false;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    handleSaveTemplate,
    toggleTemplateEditorMainTab,
    mockDataJson,
    handleMockDataChange,
    htmlBody,
  ]);

  if (!templateId) return <Navigate to="/templates" replace />;

  const templateExists = templates.some((t) => t.id === templateId);
  if (!templateExists && templates.length > 0) {
    return <Navigate to="/templates" replace />;
  }

  const isEditingTemplate = Boolean(selectedTemplate);

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Toaster
        theme="system"
        position="bottom-right"
        toastOptions={{
          style: {
            fontSize: "13px",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-subtle)",
            color: "var(--color-fg)",
          },
        }}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={saveSettings}
        onClear={clearSettings}
      />

      {settings && (
        <SendTestModal
          open={sendTestOpen}
          onClose={() => setSendTestOpen(false)}
          settings={settings}
          compiledHtml={renderedHtml}
          compiledSubject={compiledSubject}
          textBody={textBody}
        />
      )}

      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-bg px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            onClick={() => navigate("/templates")}
            className="inline-flex h-8 items-center rounded-md px-2.5 text-[13px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
            aria-label="Back to templates"
          >
            ← Templates
          </button>

          {isEditingTemplate && (
            <>
              <span className="text-fg-faint">/</span>
              <input
                type="text"
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                  setDirty(true);
                }}
                className="h-7 w-48 shrink-0 rounded-md border border-transparent bg-transparent px-1.5 text-[13px] font-medium text-fg transition-colors hover:border-border focus:border-border focus:bg-bg-subtle"
                aria-label="Template name"
              />
              <span className="text-fg-faint">&middot;</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setDirty(true);
                }}
                placeholder="Subject line {{variables}}"
                className="h-7 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 text-[13px] text-fg-secondary placeholder:text-fg-muted transition-colors hover:border-border focus:border-border focus:bg-bg-subtle"
                aria-label="Email subject"
              />
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isEditingTemplate && (
            <select
              value={templateLayoutId ?? ""}
              onChange={(e) => {
                setTemplateLayoutId(e.target.value || null);
                setDirty(true);
              }}
              className="h-8 rounded-md border border-border bg-bg px-2 pr-7 text-[12px] text-fg-secondary transition-colors hover:bg-bg-subtle"
              aria-label="Select layout"
            >
              <option value="">No layout</option>
              {layouts.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}

          {isEditingTemplate && (
            <button
              onClick={handleSendTest}
              disabled={!isConfigured}
              className={clsx(
                "inline-flex h-8 items-center rounded-md border border-border px-3 text-[13px] font-medium transition-colors",
                isConfigured
                  ? "text-fg-secondary hover:bg-bg-subtle hover:text-fg"
                  : "cursor-not-allowed text-fg-muted opacity-60",
              )}
              aria-label="Send test email"
              title={
                isConfigured
                  ? "Send test email"
                  : "Configure AWS SES in Settings to enable sending tests"
              }
            >
              Send Test
            </button>
          )}

          {isEditingTemplate && (
            <button
              onClick={() => void handleSaveTemplate()}
              className="inline-flex h-8 items-center rounded-md bg-fg px-3.5 text-[13px] font-medium text-bg transition-opacity hover:opacity-90"
              aria-label="Save"
              title="Save (Ctrl+S / Cmd+S)"
            >
              {justSaved && !isDirty ? "Saved ✓" : "Save"}
            </button>
          )}

          <div className="ml-1 flex items-center gap-0.5">
            <button
              onClick={() => setSettingsOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
              aria-label="Settings"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {isEditingTemplate ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-10 shrink-0 items-end justify-between border-b border-border bg-bg px-2">
              <div className="flex">
                <button
                  onClick={() => setTemplateEditorMainTab("edit")}
                  className={clsx(
                    "relative h-10 px-3 text-[13px] font-medium transition-colors",
                    templateEditorMainTab === "edit"
                      ? "text-fg after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-fg"
                      : "text-fg-muted hover:text-fg-secondary",
                  )}
                  aria-label="Edit tab"
                >
                  Edit
                </button>
                <button
                  onClick={() => setTemplateEditorMainTab("preview")}
                  className={clsx(
                    "relative h-10 px-3 text-[13px] font-medium transition-colors",
                    templateEditorMainTab === "preview"
                      ? "text-fg after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-fg"
                      : "text-fg-muted hover:text-fg-secondary",
                  )}
                  aria-label="Preview tab"
                >
                  Preview
                </button>
              </div>

              <div className="mb-1.5 mr-1 text-[11px] text-fg-muted">
                <kbd className="rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px]">
                  ⌘/
                </kbd>{" "}
                switch tab
              </div>
            </div>

            <div className="min-h-0 flex-1">
              {templateEditorMainTab === "edit" ? (
                <EditorPanel
                  htmlBody={htmlBody}
                  textBody={textBody}
                  onHtmlChange={(v) => {
                    setHtmlBody(v);
                    setDirty(true);
                  }}
                  onTextChange={(v) => {
                    setTextBody(v);
                    setDirty(true);
                  }}
                />
              ) : (
                <div
                  className={clsx(
                    "flex h-full min-w-0 bg-bg-subtle",
                    editorMaximized && "pointer-events-none",
                  )}
                  ref={previewSplitRef}
                >
                  <div
                    className="flex min-w-0 flex-col"
                    style={{
                      flexBasis: previewMockDataOpen
                        ? `${previewSplit * 100}%`
                        : "100%",
                    }}
                  >
                    <div className="flex h-10 items-end justify-between border-b border-border bg-bg px-2">
                      <div className="px-3 text-[12px] text-fg-muted">
                        Email Preview
                      </div>
                      <button
                        onClick={togglePreviewMockData}
                        className="mb-1.5 mr-1 inline-flex h-7 items-center rounded-md border border-border bg-bg px-2.5 text-[12px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
                        aria-label={
                          previewMockDataOpen
                            ? "Hide mock data"
                            : "Show mock data"
                        }
                      >
                        {previewMockDataOpen
                          ? "Hide mock data"
                          : "Show mock data"}
                      </button>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col bg-bg-subtle">
                      {compiledSubject && (
                        <div className="shrink-0 border-b border-border bg-bg px-3 py-2">
                          <span className="text-[11px] font-medium text-fg-muted">
                            Subject
                          </span>
                          <p className="mt-0.5 text-[13px] text-fg">
                            {compiledSubject}
                          </p>
                        </div>
                      )}

                      {compileError && (
                        <div className="shrink-0 border-b border-danger/20 bg-danger/5 px-3 py-2 text-[13px] text-danger">
                          {compileError}
                        </div>
                      )}

                      <iframe
                        srcDoc={renderedHtml ?? ""}
                        sandbox="allow-same-origin"
                        title="Email Preview"
                        className="min-h-0 flex-1 w-full border-0 bg-white"
                      />
                    </div>
                  </div>

                  {previewMockDataOpen && (
                    <>
                      <div
                        className="flex w-[6px] cursor-col-resize items-stretch justify-center bg-transparent hover:bg-bg-subtle"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.currentTarget.setPointerCapture(e.pointerId);
                          const container = previewSplitRef.current;
                          if (!container) return;
                          const rect = container.getBoundingClientRect();
                          const startX = e.clientX;
                          const startSplit = previewSplit;

                          const onMove = (moveEvent: PointerEvent) => {
                            const delta = moveEvent.clientX - startX;
                            const ratio = startSplit + delta / rect.width;
                            setPreviewSplit(ratio);
                          };

                          const onUp = (upEvent: PointerEvent) => {
                            const target = upEvent.target as HTMLElement;
                            if (
                              target &&
                              target.hasPointerCapture &&
                              target.hasPointerCapture(upEvent.pointerId)
                            ) {
                              target.releasePointerCapture(upEvent.pointerId);
                            }
                            window.removeEventListener("pointermove", onMove);
                            window.removeEventListener("pointerup", onUp);
                          };

                          window.addEventListener("pointermove", onMove);
                          window.addEventListener("pointerup", onUp);
                        }}
                        aria-label="Resize preview and mock data panels"
                      >
                        <div className="my-4 h-full w-[2px] rounded-full bg-border" />
                      </div>

                      <div
                        className="min-w-0 flex flex-col border-l border-border bg-bg"
                        style={{ flexBasis: `${(1 - previewSplit) * 100}%` }}
                      >
                        <MockDataEditor
                          value={mockDataJson}
                          htmlBody={htmlBody}
                          onChange={handleMockDataChange}
                          error={parseError}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-[13px] font-medium text-fg">
                Loading template…
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                If this takes too long, go back to Templates.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
