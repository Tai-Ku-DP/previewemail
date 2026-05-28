import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams, useBlocker } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { clsx } from "clsx";
import {
  ChevronDown,
  Code2,
  Eye,
  Paintbrush,
  Maximize,
  Minimize,
  Pencil,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { EditorPanel } from "@/editor/EditorPanel";
import { EditorTour } from "@/components/EditorTour";
import { MockDataEditor } from "@/mockdata/MockDataEditor";
import { useLayouts } from "@/hooks/useLayouts";
import { useMockData } from "@/hooks/useMockData";
import { useEditorStore } from "@/stores/editorStore";
import { buildMockDataSkeleton, compileTemplate } from "@/lib/handlebars";
import { formatHtml } from "@/lib/formatter";

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
  const [layoutAlias, setLayoutAlias] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [textBody, setTextBody] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [mainTab, setMainTab] = useState<"edit" | "preview">("edit");
  const [mockDataJson, setMockDataJson] = useState("{}");
  const [aliasModalOpen, setAliasModalOpen] = useState(false);
  const [aliasDraft, setAliasDraft] = useState("");
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
      setLayoutAlias(selectedLayout.alias || "");
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
          alias: layoutAlias || selectedLayout.alias,
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
    [
      selectedLayout,
      updateLayout,
      layoutName,
      layoutAlias,
      htmlBody,
      textBody,
      setDirty,
    ],
  );

  const openAliasModal = () => {
    setAliasDraft(layoutAlias);
    setAliasModalOpen(true);
  };

  const updateAliasDraft = (value: string) => {
    setAliasDraft(value.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase());
  };

  const commitAliasDraft = () => {
    const nextAlias = aliasDraft.trim();
    setLayoutAlias(nextAlias);
    setDirty(true);
    setAliasModalOpen(false);
  };

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
        void handleSaveLayout().finally(() => {
          formatInProgress.current = false;
        });
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setMainTab((t) => (t === "edit" ? "preview" : "edit"));
      }

      if (e.shiftKey && e.altKey && e.key === "F") {
        e.preventDefault();
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
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSaveLayout, htmlBody, setDirty]);

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
    <div className="flex h-screen flex-col bg-bg overflow-auto">
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

      {/* Alias Modal */}
      {aliasModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setAliasModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-border bg-bg shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-alias-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border px-5 py-4">
              <h2
                id="edit-alias-title"
                className="text-sm font-semibold text-fg"
              >
                Edit alias
              </h2>
              <p className="mt-1 text-xs text-fg-muted">
                Alias is used for API calls. Use letters, numbers, - or _.
              </p>
            </div>

            <form
              className="space-y-4 px-5 py-4"
              onSubmit={(e) => {
                e.preventDefault();
                commitAliasDraft();
              }}
            >
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-fg">
                  Alias
                </span>
                <Input
                  autoFocus
                  value={aliasDraft}
                  onChange={(e) => updateAliasDraft(e.target.value)}
                  placeholder="layout-alias"
                  className="h-10 font-mono text-[13px]"
                  aria-label="Layout alias"
                />
              </label>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAliasModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save alias</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Nav Header */}
      {!editorMaximized && (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-bg px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Logo />
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <div className="ml-1 flex items-center gap-0.5">
              <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
              <ThemeToggle />
              <EditorTour />
            </div>
          </div>
        </header>
      )}

      {/* Fields Header */}
      {!editorMaximized && (
        <header className="shrink-0 overflow-x-auto bg-bg px-5 py-4">
          {isEditingLayout ? (
            <div className="grid min-w-[600px] grid-cols-[minmax(240px,1fr)_minmax(150px,0.42fr)_34px] items-end gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="layout-name"
                    className="text-[13px] font-semibold leading-none text-fg"
                  >
                    Name
                  </label>
                  <button
                    type="button"
                    onClick={openAliasModal}
                    className="min-w-0 rounded px-1 py-0.5 text-left text-[12px] font-medium text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-ring/40"
                    title="Edit alias"
                    aria-label="Edit layout alias"
                  >
                    <span>Alias: </span>
                    <span className="font-mono text-[12px] underline decoration-border underline-offset-4">
                      {layoutAlias || "alias"}
                    </span>
                  </button>
                </div>
                <Input
                  id="layout-name"
                  type="text"
                  value={layoutName}
                  onChange={(e) => {
                    setLayoutName(e.target.value);
                    setDirty(true);
                  }}
                  className="h-11 rounded-md border-border bg-bg px-3 text-[15px] font-semibold text-fg shadow-sm focus-visible:ring-2 focus-visible:ring-ring/30"
                  aria-label="Layout name"
                />
              </div>

              <div className="flex min-w-0 items-end">
                <Button
                  id="tour-editor-save"
                  onClick={() => void handleSaveLayout()}
                  className={clsx(
                    "h-11 w-full rounded-md text-[14px] font-semibold transition-colors",
                    isDirty
                      ? "bg-fg text-bg hover:bg-fg/90"
                      : "bg-[#b7b7b7] text-white hover:bg-[#a9a9a9]",
                  )}
                  aria-label="Save"
                  title="Save (Ctrl+S / Cmd+S)"
                >
                  {justSaved && !isDirty ? "Saved" : "Save"}
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  className="mb-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg text-fg-muted shadow-sm transition-colors hover:bg-bg-subtle hover:text-fg"
                  aria-label="Layout actions"
                >
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Layout actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="flex items-center justify-between gap-2 px-1.5 py-1">
                    <span className="text-sm text-fg-secondary">Theme</span>
                    <ThemeToggle />
                  </div>
                  <div className="px-1.5 py-1">
                    <EditorTour />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex h-16 items-center justify-between">
              <Logo />
              <ThemeToggle />
            </div>
          )}
        </header>
      )}

      <div
        className={clsx(
          "flex min-h-0 flex-1",
          isEditingLayout && !editorMaximized && "bg-bg px-5 pb-5",
        )}
      >
        {isEditingLayout ? (
          <div
            className={clsx(
              "flex min-w-0 flex-1 flex-col overflow-hidden h-[700px]",
              !editorMaximized &&
                "rounded-md border border-[#1f232b] bg-[#2f333b] shadow-[0_14px_36px_rgba(15,23,42,0.18)]",
            )}
          >
            {/* Dark Tab Bar */}
            <div className="flex h-12 shrink-0 items-stretch justify-between bg-[#24272e]">
              <div className="flex">
                <button
                  onClick={() => setMainTab("edit")}
                  className={clsx(
                    "inline-flex min-w-[112px] items-center gap-2 px-5 text-[14px] font-semibold transition-colors",
                    mainTab === "edit"
                      ? "bg-[#30343c] text-white"
                      : "text-[#a7acb8] hover:bg-[#2a2e36] hover:text-white",
                  )}
                  aria-label="Edit tab"
                >
                  <Pencil className="h-4 w-4 text-[#f7df4d]" />
                  Edit
                </button>
                <button
                  id="tour-editor-preview-tab"
                  onClick={() => setMainTab("preview")}
                  className={clsx(
                    "inline-flex min-w-[124px] items-center gap-2 px-5 text-[14px] font-semibold transition-colors",
                    mainTab === "preview"
                      ? "bg-[#30343c] text-white"
                      : "text-[#a7acb8] hover:bg-[#2a2e36] hover:text-white",
                  )}
                  aria-label="Preview tab"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
              </div>

              <div className="flex items-center gap-3 px-4">
                <div className="hidden text-[11px] font-medium text-[#8f96a6] xl:block">
                  <kbd className="rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px]">
                    ⌘/
                  </kbd>{" "}
                  switch tab
                </div>

                <div className="flex items-center gap-1.5">
                  {mainTab === "preview" && (
                    <button
                      onClick={togglePreviewMockData}
                      className="inline-flex h-7 items-center rounded-md border border-[#687083] bg-transparent px-2.5 text-[12px] font-semibold text-[#a7acb8] transition-colors hover:bg-[#30343c] hover:text-white"
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
                        if (formatInProgress.current) return;
                        formatInProgress.current = true;
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
                          )
                          .finally(() => {
                            formatInProgress.current = false;
                          });
                      }}
                      disabled={!htmlBody.trim()}
                      className={clsx(
                        "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-semibold transition-colors",
                        !htmlBody.trim()
                          ? "cursor-not-allowed border-[#4a5060] bg-transparent text-[#727987] opacity-60"
                          : "border-[#687083] bg-transparent text-[#a7acb8] hover:bg-[#30343c] hover:text-white",
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
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#8f96a6] transition-colors hover:bg-[#30343c] hover:text-white"
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

            {/* Editor / Preview Area */}
            <div
              id="tour-editor-code"
              className="relative min-h-0 flex-1 flex flex-col"
            >
              {/* Edit Panel */}
              <div
                className={clsx(
                  "absolute inset-0 flex min-h-0 flex-col",
                  mainTab !== "edit" && "invisible pointer-events-none",
                )}
                aria-hidden={mainTab !== "edit"}
              >
                <div className="flex h-12 shrink-0 items-center bg-[#30343c] px-5">
                  <div className="flex overflow-hidden rounded-md bg-[#22262e] p-1">
                    <button
                      className="inline-flex h-8 min-w-[92px] items-center justify-center gap-2 rounded-[4px] bg-[#4b515d] px-4 text-[13px] font-semibold text-white shadow-sm"
                      aria-label="HTML editor"
                    >
                      <Code2 className="h-4 w-4" />
                      HTML
                    </button>
                  </div>
                </div>
                <EditorPanel
                  htmlBody={htmlBody}
                  editorTabActive={mainTab === "edit"}
                  onHtmlChange={(v) => {
                    setHtmlBody(v);
                    setDirty(true);
                  }}
                />
              </div>

              {/* Preview Panel */}
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
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-[13px] font-medium text-fg">Loading layout…</p>
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
