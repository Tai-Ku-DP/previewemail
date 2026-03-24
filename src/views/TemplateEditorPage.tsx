import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { clsx } from "clsx";
import { Settings, Paintbrush, Maximize, Minimize } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { SettingsModal } from "@/components/SettingsModal";
import { EditorPanel } from "@/editor/EditorPanel";
import { EditorTour } from "@/components/EditorTour";
import { MockDataEditor } from "@/mockdata/MockDataEditor";
import { useTemplates } from "@/hooks/useTemplates";
import { useLayouts } from "@/hooks/useLayouts";
import { useMockData } from "@/hooks/useMockData";
import { usePreview } from "@/hooks/usePreview";
import { useSettings } from "@/hooks/useSettings";
import { useEditorStore } from "@/stores/editorStore";
import { formatHtml, formatJson } from "@/lib/formatter";
import { buildMockDataSkeleton } from "@/lib/handlebars";
import { StorageIndicator } from "@/components/StorageIndicator";
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
  const isDirty = useEditorStore((s) => s.isDirty);
  const setDirty = useEditorStore((s) => s.setDirty);
  const {
    settings,
    save: saveSettings,
    clear: clearSettings,
  } = useSettings();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const previewSplitRef = useRef<HTMLDivElement | null>(null);


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
  }, [templateLayoutId, getLayoutById, layouts]);

  const { renderedHtml, compiledSubject } = usePreview(
    htmlBody,
    subject,
    mockData,
    activeLayout?.htmlBody,
  );

  const previewSrcDoc = useMemo(
    () => wrapIframeSrcDoc(renderedHtml ?? ""),
    [renderedHtml],
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
    let isParsable = true;
    try {
      current = JSON.parse(mockDataJson) as Record<string, unknown>;
    } catch {
      isParsable = false;
    }

    // Do not format or touch user's JSON if they are in the middle of typing an invalid structure
    if (!isParsable) return;

    const filled: Record<string, unknown> = { ...current };

    // Merge skeleton from both template + selected layout so layout-only vars (e.g. {{companyName}})
    // are also auto-mapped when switching/choosing a layout.
    mergeDeep(filled, buildMockDataSkeleton(htmlBody));
    if (activeLayout?.htmlBody) {
      mergeDeep(filled, buildMockDataSkeleton(activeLayout.htmlBody));
    }
    
    // Only auto-format and update if new skeleton keys were actually recursively added
    if (JSON.stringify(filled) !== JSON.stringify(current)) {
      const nextJson = JSON.stringify(filled, null, 2);
      if (nextJson !== mockDataJson) {
        queueMicrotask(() => {
          setMockDataJson(nextJson);
          updateFromJson(nextJson);
          setDirty(true);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateEditorMainTab, htmlBody, activeLayout?.htmlBody]); // INTENTIONALLY EXCLUDING mockDataJson!

  const handleSaveTemplate = useCallback(
    async (overrides?: {
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
        if (
          overrides?.mockDataJson &&
          overrides.mockDataJson !== mockDataJson
        ) {
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
    },
    [
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
    ],
  );

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Changes you made may not be saved.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

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
        void handleSaveTemplate().finally(() => {
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
              setDirty(true);
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
    setDirty,
  ]);

  if (!templateId) return <Navigate to="/templates" replace />;

  const templateExists = templates.some((t) => t.id === templateId);
  if (!templateExists && templates.length > 0) {
    return <Navigate to="/templates" replace />;
  }

  const isEditingTemplate = Boolean(selectedTemplate);

  return (
    <div className="flex h-screen flex-col bg-bg overflow-hidden">
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

      {!editorMaximized && (
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-bg px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Logo className="h-7 w-7" />
          <button
            onClick={() => {
              if (isDirty) {
                if (!window.confirm("Changes you made may not be saved. Are you sure you want to leave?")) {
                  return;
                }
              }
              navigate("/templates");
            }}
            className="inline-flex h-8 items-center rounded-md px-2.5 text-[13px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
            aria-label="Back to templates"
          >
            ← Templates
          </button>

          {isEditingTemplate && (
            <>
              <span className="text-fg-faint">/</span>
              <Input
                type="text"
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                  setDirty(true);
                }}
                className="h-7 w-48 shrink-0 rounded-md border-transparent bg-transparent px-1.5 text-[13px] font-medium text-fg shadow-none transition-colors hover:border-border focus-visible:border-border focus-visible:bg-bg-subtle focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Template name"
              />
              <span className="text-fg-faint">&middot;</span>
              <Input
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setDirty(true);
                }}
                placeholder="Subject line {{variables}}"
                className="h-7 min-w-0 flex-1 rounded-md border-transparent bg-transparent px-1.5 text-[13px] text-fg-secondary shadow-none placeholder:text-fg-muted transition-colors hover:border-border focus-visible:border-border focus-visible:bg-bg-subtle focus-visible:ring-0 focus-visible:ring-offset-0"
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
              id="tour-editor-save"
              onClick={() => void handleSaveTemplate()}
              className="inline-flex h-8 items-center rounded-md bg-fg px-3.5 text-[13px] font-medium text-bg transition-opacity hover:opacity-90"
              aria-label="Save"
              title="Save (Ctrl+S / Cmd+S)"
            >
              {justSaved && !isDirty ? "Saved ✓" : "Save"}
            </button>
          )}

          <div className="ml-1 flex items-center gap-0.5">
            <div className="hidden sm:block mr-1">
              <StorageIndicator />
            </div>

            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

            <button
              onClick={() => setSettingsOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <ThemeToggle />
            <EditorTour />
          </div>
        </div>
      </header>
      )}

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
                  id="tour-editor-preview-tab"
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

              <div className="flex items-center gap-4 items-center mb-1">
                <div className="text-[11px] text-fg-muted">
                  <kbd className="rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px]">
                    ⌘/
                  </kbd>{" "}
                  switch tab
                </div>

                <div className="flex items-center gap-1.5">
                  {templateEditorMainTab === "preview" && (
                    <button
                      onClick={togglePreviewMockData}
                      className="inline-flex h-7 items-center rounded-md border border-border bg-bg px-2.5 text-[12px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
                      aria-label={
                        previewMockDataOpen ? "Hide mock data" : "Show mock data"
                      }
                    >
                      {previewMockDataOpen ? "Hide mock data" : "Show mock data"}
                    </button>
                  )}
                  {templateEditorMainTab === "edit" && (
                    <button
                      onClick={() => {
                        if (formatInProgress.current) return;
                        formatInProgress.current = true;
                        void formatHtml(htmlBody)
                          .then((formatted) => {
                            setHtmlBody(formatted);
                            setDirty(true);
                            toast.success("HTML formatted");
                          })
                          .catch(() => toast.error("Format failed — check Handlebars syntax"))
                          .finally(() => {
                            formatInProgress.current = false;
                          });
                      }}
                      disabled={!htmlBody.trim()}
                      className={clsx(
                        'inline-flex h-7 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12px] font-medium transition-colors',
                        (!htmlBody.trim())
                          ? 'opacity-50 cursor-not-allowed text-fg-muted bg-bg-subtle'
                          : 'bg-bg text-fg-secondary hover:bg-bg-subtle hover:text-fg',
                      )}
                      aria-label="Format code"
                      title="Format HTML (Shift+Alt+F)"
                    >
                      <Paintbrush className="h-3.5 w-3.5" />
                      Format
                    </button>
                  )}
                  <button
                    onClick={() => useEditorStore.getState().toggleEditorMaximized()}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-bg text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
                    aria-label={editorMaximized ? 'Exit fullscreen' : 'Fullscreen editor'}
                    title={editorMaximized ? 'Exit fullscreen (Esc)' : 'Fullscreen editor'}
                  >
                    {editorMaximized ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div id="tour-editor-code" className="min-h-0 flex-1 flex flex-col">
              {templateEditorMainTab === "edit" ? (
                <EditorPanel
                  htmlBody={htmlBody}
                  onHtmlChange={(v: string) => {
                    setHtmlBody(v);
                    setDirty(true);
                  }}
                />
              ) : (
                <div
                  className="flex min-h-0 flex-1 min-w-0 bg-bg-subtle"
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
                    <div className="flex min-h-0 flex-1 flex-col bg-bg-subtle">
                      {compiledSubject && (
                        <div className="shrink-0 border-b border-border sbg-bg px-3 py-2">
                          <span className="text-[13px] font-medium text-fg-muted">
                            Subject:
                            <span className="mt-0.5 text-[13px] text-fg ml-2">
                              {compiledSubject}
                            </span>
                          </span>
                        </div>
                      )}

                      <iframe
                        srcDoc={previewSrcDoc}
                        sandbox="allow-same-origin"
                        title="Email Preview"
                        className="h-full min-h-0 flex-1 w-full border-0 bg-white"
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
                        className="min-w-0 flex flex-col h-full border-l border-border bg-bg"
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

function wrapIframeSrcDoc(html: string): string {
  const safe = html ?? "";
  const style = `<style>html,body{margin:0 !important;padding:0 !important;}</style>`;

  if (!safe.trim()) return safe;

  // If template already includes <html>/<head>, inject style there.
  if (/<html[\s>]/i.test(safe)) {
    if (/<head[\s>]/i.test(safe)) {
      return safe.replace(/<head([^>]*)>/i, `<head$1>${style}`);
    }
    return safe.replace(/<html([^>]*)>/i, `<html$1><head>${style}</head>`);
  }

  // If template includes <body>, inject style into it.
  if (/<body[\s>]/i.test(safe)) {
    return safe.replace(/<body([^>]*)>/i, `<body$1>${style}`);
  }

  // Otherwise, wrap as a full document.
  return `<!doctype html><html><head>${style}</head><body>${safe}</body></html>`;
}
