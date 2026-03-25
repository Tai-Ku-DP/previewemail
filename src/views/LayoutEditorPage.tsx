import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams, useBlocker } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { clsx } from "clsx";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EditorPanel } from "@/editor/EditorPanel";
import { EditorTour } from "@/components/EditorTour";
import { MockDataEditor } from "@/mockdata/MockDataEditor";
import { useLayouts } from "@/hooks/useLayouts";
import { useMockData } from "@/hooks/useMockData";
import { useEditorStore } from "@/stores/editorStore";
import { buildMockDataSkeleton, compileTemplate } from "@/lib/handlebars";
import { formatHtml } from "@/lib/formatter";
import { Paintbrush, Maximize, Minimize } from "lucide-react";

export default function LayoutEditorPage() {
  const { layoutId } = useParams<{ layoutId: string }>();

  const { layouts, selectedLayout, selectLayout, updateLayout } = useLayouts();

  const isDirty = useEditorStore((s) => s.isDirty);
  const setDirty = useEditorStore((s) => s.setDirty);
  const previewMockDataOpen = useEditorStore((s) => s.previewMockDataOpen);
  const togglePreviewMockData = useEditorStore((s) => s.togglePreviewMockData);
  const previewSplit = useEditorStore((s) => s.previewSplit);
  const setPreviewSplit = useEditorStore((s) => s.setPreviewSplit);
  const editorMaximized = useEditorStore((s) => s.editorMaximized);

  const [layoutName, setLayoutName] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [textBody, setTextBody] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [mainTab, setMainTab] = useState<"edit" | "preview">("edit");
  const [mockDataJson, setMockDataJson] = useState("{}");
  const previewSplitRef = useRef<HTMLDivElement | null>(null);

  const { mockData, parseError, updateFromJson, reset } = useMockData();

  useEffect(() => {
    if (!layoutId) return;
    selectLayout(layoutId);
  }, [layoutId, selectLayout]);

  useEffect(() => {
    if (!selectedLayout) return;
    queueMicrotask(() => {
      setLayoutName(selectedLayout.name);
      setHtmlBody(selectedLayout.htmlBody);
      setTextBody(selectedLayout.textBody);
      const json = JSON.stringify({}, null, 2);
      setMockDataJson(json);
      reset({});
      setDirty(false);
    });
  }, [selectedLayout, setDirty, reset]);

  const handleMockDataChange = useCallback(
    (value: string) => {
      setMockDataJson(value);
      updateFromJson(value);
    },
    [updateFromJson],
  );

  useEffect(() => {
    if (mainTab !== "preview") return;

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

    if (!isParsable) return;

    const filled: Record<string, unknown> = { ...current };
    const skeleton = buildMockDataSkeleton(htmlBody);
    mergeDeep(filled, skeleton);

    if (JSON.stringify(filled) !== JSON.stringify(current)) {
      const nextJson = JSON.stringify(filled, null, 2);
      if (nextJson !== mockDataJson) {
        queueMicrotask(() => {
          setMockDataJson(nextJson);
          updateFromJson(nextJson);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainTab, htmlBody]);

  const { renderedHtml, compileError } = useMemo(() => {
    const placeholder = `
      <div style="border:2px dashed #d4d4d8;border-radius:8px;padding:32px;margin:16px 0;text-align:center;color:#a1a1aa;font-family:sans-serif;font-size:14px;">
        <div style="margin-bottom:8px;font-size:20px;">📄</div>
        Template content will be injected here
        <div style="margin-top:4px;font-size:11px;opacity:0.7;">{{{@content}}}</div>
      </div>
    `;
    const previewHtml = htmlBody.replace(/\{\{\{@content\}\}\}/g, placeholder);
    const compiled = compileTemplate(previewHtml, mockData);
    return {
      renderedHtml: compiled.result ?? "",
      compileError: compiled.error,
    };
  }, [htmlBody, mockData]);

  const previewSrcDoc = useMemo(
    () => wrapIframeSrcDoc(renderedHtml ?? ""),
    [renderedHtml],
  );

  const handleSaveLayout = useCallback(
    async (overrides?: { htmlBody?: string }) => {
      if (!selectedLayout) return;
      try {
        const nextHtmlBody = overrides?.htmlBody ?? htmlBody;
        await updateLayout(selectedLayout.id, {
          name: layoutName,
          htmlBody: nextHtmlBody,
          textBody,
        });
        if (overrides?.htmlBody && overrides.htmlBody !== htmlBody) {
          setHtmlBody(overrides.htmlBody);
        }
        toast.success("Layout saved");
        setDirty(false);
        setJustSaved(true);
        window.setTimeout(() => setJustSaved(false), 2000);
      } catch {
        toast.error("Failed to save layout");
      }
    },
    [selectedLayout, updateLayout, layoutName, htmlBody, textBody, setDirty],
  );

  const saveInProgress = useRef(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (saveInProgress.current) return;
        saveInProgress.current = true;
        void handleSaveLayout().finally(() => {
          saveInProgress.current = false;
        });
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setMainTab((t) => (t === "edit" ? "preview" : "edit"));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSaveLayout, htmlBody]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "Changes you made may not be saved.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useBlocker(({ currentLocation, nextLocation }) => {
    if (!isDirty) return false;
    if (currentLocation.pathname !== nextLocation.pathname) {
      return !window.confirm(
        "Changes you made may not be saved. Are you sure you want to leave?",
      );
    }
    return false;
  });

  if (!layoutId) return <Navigate to="/templates" replace />;
  const layoutExists = layouts.some((l) => l.id === layoutId);
  if (!layoutExists && layouts.length > 0)
    return <Navigate to="/templates" replace />;

  const isEditingLayout = Boolean(selectedLayout);

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

      {!editorMaximized && (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-bg px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Logo />

            {isEditingLayout && (
              <input
                type="text"
                value={layoutName}
                onChange={(e) => {
                  setLayoutName(e.target.value);
                  setDirty(true);
                }}
                className="h-7 w-56 shrink-0 rounded-md border border-transparent bg-transparent px-1.5 text-[13px] font-medium text-fg transition-colors hover:border-border focus:border-border focus:bg-bg-subtle"
                aria-label="Layout name"
              />
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {isEditingLayout && (
              <button
                id="tour-editor-save"
                onClick={() => void handleSaveLayout()}
                className={clsx(
                  "inline-flex h-8 items-center rounded-md px-3.5 text-[13px] font-medium transition-opacity",
                  isDirty
                    ? "bg-fg text-bg hover:opacity-90"
                    : "border border-border bg-bg text-fg-secondary hover:bg-bg-subtle hover:text-fg",
                )}
                aria-label="Save layout"
                title="Save (Ctrl+S / Cmd+S)"
              >
                {justSaved && !isDirty ? "Saved ✓" : "Save"}
              </button>
            )}
            <ThemeToggle />
            <EditorTour />
          </div>
        </header>
      )}

      <div className="flex min-h-0 flex-1">
        {isEditingLayout ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-10 shrink-0 items-end justify-between border-b border-border bg-bg px-2">
              <div className="flex">
                <button
                  onClick={() => setMainTab("edit")}
                  className={clsx(
                    "relative h-10 px-3 text-[13px] font-medium transition-colors",
                    mainTab === "edit"
                      ? "text-fg after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-fg"
                      : "text-fg-muted hover:text-fg-secondary",
                  )}
                  aria-label="Edit tab"
                >
                  Edit
                </button>
                <button
                  id="tour-editor-preview-tab"
                  onClick={() => setMainTab("preview")}
                  className={clsx(
                    "relative h-10 px-3 text-[13px] font-medium transition-colors",
                    mainTab === "preview"
                      ? "text-fg after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-fg"
                      : "text-fg-muted hover:text-fg-secondary",
                  )}
                  aria-label="Preview tab"
                >
                  Preview
                </button>
              </div>

              <div className="mb-1.5 mr-1 flex items-center gap-4">
                <div className="text-[11px] text-fg-muted">
                  <kbd className="rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px]">
                    ⌘/
                  </kbd>{" "}
                  switch tab
                </div>
                <div className="flex items-center gap-1.5">
                  {mainTab === "preview" && (
                    <button
                      onClick={togglePreviewMockData}
                      className="inline-flex h-7 items-center rounded-md border border-border bg-bg px-2.5 text-[12px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
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
                  )}
                  {mainTab === "edit" && (
                    <button
                      onClick={() => {
                        if (!htmlBody.trim()) return;
                        void formatHtml(htmlBody)
                          .then((formatted) => {
                            setHtmlBody(formatted);
                            setDirty(true);
                            toast.success("HTML formatted");
                          })
                          .catch(() =>
                            toast.error(
                              "Format failed — check Handlebars syntax",
                            ),
                          );
                      }}
                      disabled={!htmlBody.trim()}
                      className={clsx(
                        "inline-flex h-7 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12px] font-medium transition-colors",
                        !htmlBody.trim()
                          ? "opacity-50 cursor-not-allowed text-fg-muted bg-bg-subtle"
                          : "bg-bg text-fg-secondary hover:bg-bg-subtle hover:text-fg",
                      )}
                      aria-label="Format code"
                      title="Format HTML (Shift+Alt+F)"
                    >
                      <Paintbrush className="h-3.5 w-3.5" />
                      Format
                    </button>
                  )}
                  <button
                    onClick={() =>
                      useEditorStore.getState().toggleEditorMaximized()
                    }
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-bg text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
                    aria-label={
                      editorMaximized ? "Exit fullscreen" : "Fullscreen editor"
                    }
                    title={
                      editorMaximized
                        ? "Exit fullscreen (Esc)"
                        : "Fullscreen editor"
                    }
                  >
                    {editorMaximized ? (
                      <Minimize className="h-4 w-4" />
                    ) : (
                      <Maximize className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div id="tour-editor-code" className="relative min-h-0 flex-1 flex flex-col">
              <div
                className={clsx(
                  "absolute inset-0 flex min-h-0 flex-col",
                  mainTab !== "edit" && "invisible pointer-events-none",
                )}
                aria-hidden={mainTab !== "edit"}
              >
                <EditorPanel
                  htmlBody={htmlBody}
                  editorTabActive={mainTab === "edit"}
                  onHtmlChange={(v) => {
                    setHtmlBody(v);
                    setDirty(true);
                  }}
                />
              </div>
              <div
                className={clsx(
                  "absolute inset-0 flex min-h-0 min-w-0 flex-1 bg-bg-subtle",
                  mainTab !== "preview" && "invisible pointer-events-none",
                )}
                aria-hidden={mainTab !== "preview"}
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
                      {compileError && (
                        <div className="shrink-0 border-b border-danger/20 bg-danger/5 px-3 py-2 text-[13px] text-danger">
                          {compileError}
                        </div>
                      )}
                      <iframe
                        srcDoc={previewSrcDoc}
                        sandbox="allow-same-origin"
                        title="Layout Preview"
                        className="h-full min-h-0 flex-1 w-full border-0 bg-[#f8fafc]"
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
            </div>
          </div>
        ) : (
          <div className="p-4 text-xs text-fg-muted">Loading…</div>
        )}
      </div>
    </div>
  );
}

function wrapIframeSrcDoc(html: string): string {
  const safe = html ?? "";
  const style = `<style>html,body{margin:0 !important;padding:0 !important;}</style>`;

  if (!safe.trim()) return safe;

  if (/<html[\s>]/i.test(safe)) {
    if (/<head[\s>]/i.test(safe)) {
      return safe.replace(/<head([^>]*)>/i, `<head$1>${style}`);
    }
    return safe.replace(/<html([^>]*)>/i, `<html$1><head>${style}</head>`);
  }

  if (/<body[\s>]/i.test(safe)) {
    return safe.replace(/<body([^>]*)>/i, `<body$1>${style}`);
  }

  return `<!doctype html><html><head>${style}</head><body>${safe}</body></html>`;
}
