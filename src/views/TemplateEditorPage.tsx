import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams, useBlocker } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { clsx } from "clsx";
import {
  ChevronDown,
  Code2,
  Eye,
  Settings,
  Paintbrush,
  Maximize,
  Minimize,
  Pencil,
  Send,
  // Smartphone,
  // Monitor,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useV2Config } from "@/hooks/useV2Config";
import { useEditorStore } from "@/stores/editorStore";
import { formatHtml, formatJson } from "@/lib/formatter";
import { buildMockDataSkeleton } from "@/lib/handlebars";
import type { Layout } from "@/types";
import { sendTestEmail } from "@/lib/ses";
import { useTemplateStore } from "@/stores/templateStore";
import { StorageIndicator } from "@/components/StorageIndicator";

export default function TemplateEditorPage() {
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
  const { settings, save: saveSettings, clear: clearSettings } = useSettings();
  const {
    config: v2Config,
    save: saveV2Config,
    clear: clearV2Config,
  } = useV2Config();
  const syncStatus = useTemplateStore((s) => s.syncStatus);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aliasModalOpen, setAliasModalOpen] = useState(false);
  const [aliasDraft, setAliasDraft] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const previewSplitRef = useRef<HTMLDivElement | null>(null);

  // Template editing state
  const [htmlBody, setHtmlBody] = useState("");
  const [textBody, setTextBody] = useState("");
  const [subject, setSubject] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateAlias, setTemplateAlias] = useState("");
  const [templateLayoutId, setTemplateLayoutId] = useState<string | null>(null);
  const [mockDataJson, setMockDataJson] = useState("{}");
  const [previewDevice] = useState<"desktop" | "mobile">("desktop");

  const { mockData, parseError, updateFromJson, reset } = useMockData();

  useEffect(() => {
    if (!templateId) return;
    selectTemplate(templateId);
  }, [templateId, selectTemplate]);

  // Sync template state when selection changes
  useEffect(() => {
    if (!selectedTemplate) return;
    queueMicrotask(() => {
      setHtmlBody(selectedTemplate.htmlBody || "");
      setTextBody(selectedTemplate.textBody || "");
      setSubject(selectedTemplate.subject || "");
      setTemplateName(selectedTemplate.name || "");
      setTemplateAlias(selectedTemplate.alias || "");
      setTemplateLayoutId(selectedTemplate.layoutId || null);
      const json = JSON.stringify(selectedTemplate.mockData || {}, null, 2);
      setMockDataJson(json);
      reset(selectedTemplate.mockData || {});
      setDirty(false);
    });
  }, [selectedTemplate, reset, setDirty]);

  const activeLayout: Layout | undefined = useMemo(() => {
    if (templateLayoutId) return getLayoutById(templateLayoutId);
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          alias: templateAlias || selectedTemplate.alias,
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
      templateAlias,
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

  const handleSendTest = useCallback(async () => {
    if (
      !settings?.accessKeyId ||
      !settings?.secretAccessKey ||
      !settings?.fromAddress ||
      !settings?.region
    ) {
      toast.error("Please configure AWS SES credentials in Settings");
      setSettingsOpen(true);
      return;
    }
    const emailTo = window.prompt("Enter recipient email address:");
    if (!emailTo) return;

    setIsSendingTest(true);
    const toastId = toast.loading("Sending test email...");
    try {
      await sendTestEmail({
        to: emailTo.trim(),
        subject: compiledSubject || subject || "Test PreviewMail",
        html: renderedHtml || htmlBody,
        text: textBody,
        settings,
      });
      toast.success("Test email sent!", { id: toastId });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send test email",
        { id: toastId },
      );
    } finally {
      setIsSendingTest(false);
    }
  }, [settings, compiledSubject, subject, renderedHtml, htmlBody, textBody]);

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

  const openAliasModal = () => {
    setAliasDraft(templateAlias);
    setAliasModalOpen(true);
  };

  const updateAliasDraft = (value: string) => {
    setAliasDraft(value.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase());
  };

  const commitAliasDraft = () => {
    const nextAlias = aliasDraft.trim();
    setTemplateAlias(nextAlias);
    setDirty(true);
    setAliasModalOpen(false);
  };

  if (!templateId) return <Navigate to="/templates" replace />;

  const templateExists = templates.some((t) => t.id === templateId);
  if (!templateExists && templates.length > 0) {
    return <Navigate to="/templates" replace />;
  }

  const isEditingTemplate = Boolean(selectedTemplate);

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

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={saveSettings}
        onClear={clearSettings}
        v2Config={v2Config}
        onSaveV2Config={saveV2Config}
        onClearV2Config={clearV2Config}
      />

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
                  placeholder="template-alias"
                  className="h-10 font-mono text-[13px]"
                  aria-label="Template alias"
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

      {!editorMaximized && (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-bg px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Logo />
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {isEditingTemplate && (
              <button
                onClick={() => void handleSendTest()}
                disabled={isSendingTest}
                className={clsx(
                  "mr-1.5 inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors border border-border bg-bg",
                  isSendingTest
                    ? "opacity-60 cursor-not-allowed text-fg-muted"
                    : "text-fg-secondary hover:bg-bg-subtle hover:text-fg",
                )}
                aria-label="Send test email"
                title="Send Test Email"
              >
                <Send className="h-3.5 w-3.5" />
                {isSendingTest ? "Sending..." : "Test"}
              </button>
            )}

            <div className="ml-1 flex items-center gap-0.5">
              <div className="hidden sm:block mr-1">
                <StorageIndicator />
              </div>

              {/* Sync Status Badge */}
              <div
                className="hidden sm:flex items-center mx-1 px-2.5 py-1.5 rounded-md bg-bg-subtle border border-border text-[11px] font-medium leading-none cursor-default"
                title={
                  syncStatus === "synced"
                    ? "Synced to Database (API Mode)"
                    : syncStatus === "sync_failed"
                      ? "Fail to Sync (Local Cache Only)"
                      : "Local Storage Mode"
                }
              >
                {syncStatus === "synced" && (
                  <span className="mr-1.5 flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                )}
                {syncStatus === "local_only" && (
                  <span className="mr-1.5 flex h-2 w-2 rounded-full bg-yellow-500" />
                )}
                {syncStatus === "sync_failed" && (
                  <span className="mr-1.5 flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                )}
                <span className="text-fg-secondary">
                  {syncStatus === "synced"
                    ? "Synced"
                    : syncStatus === "sync_failed"
                      ? "Sync Failed"
                      : "Local"}
                </span>
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

      {!editorMaximized && (
        <header className="shrink-0 overflow-x-auto bg-bg px-5 py-4">
          {isEditingTemplate ? (
            <div className="grid min-w-[920px] grid-cols-[minmax(240px,0.9fr)_minmax(360px,1.45fr)_minmax(150px,0.42fr)_34px] items-end gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="template-name"
                    className="text-[13px] font-semibold leading-none text-fg"
                  >
                    Name
                  </label>
                  <button
                    type="button"
                    onClick={openAliasModal}
                    className="min-w-0 rounded px-1 py-0.5 text-left text-[12px] font-medium text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-ring/40"
                    title="Edit alias"
                    aria-label="Edit template alias"
                  >
                    <span>Alias: </span>
                    <span className="font-mono text-[12px] underline decoration-border underline-offset-4">
                      {templateAlias || "alias"}
                    </span>
                  </button>
                </div>
                <Input
                  id="template-name"
                  type="text"
                  value={templateName}
                  onChange={(e) => {
                    setTemplateName(e.target.value);
                    setDirty(true);
                  }}
                  className="h-11 rounded-md border-border bg-bg px-3 text-[15px] font-semibold text-fg shadow-sm focus-visible:ring-2 focus-visible:ring-ring/30"
                  aria-label="Template name"
                />
              </div>

              <label className="min-w-0">
                <span className="mb-2 block text-[13px] font-semibold leading-none text-fg">
                  Subject
                </span>
                <Input
                  type="text"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setDirty(true);
                  }}
                  placeholder="Subject line {{variables}}"
                  className="h-11 rounded-md border-border bg-bg px-3 text-[15px] font-semibold text-fg shadow-sm placeholder:text-fg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
                  aria-label="Email subject"
                  title="Supports {{variables}}"
                />
              </label>

              <div className="flex min-w-0 items-end">
                <Button
                  id="tour-editor-save"
                  onClick={() => void handleSaveTemplate()}
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
                  aria-label="Template actions"
                >
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Template actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                    <Settings className="h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
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
          isEditingTemplate && !editorMaximized && "bg-bg px-5 pb-5",
        )}
      >
        {isEditingTemplate ? (
          <div
            className={clsx(
              "flex min-w-0 flex-1 flex-col overflow-hidden h-[700px]",
              !editorMaximized &&
                "rounded-md border border-[#1f232b] bg-[#2f333b] shadow-[0_14px_36px_rgba(15,23,42,0.18)]",
            )}
          >
            <div className="flex h-12 shrink-0 items-stretch justify-between bg-[#24272e]">
              <div className="flex">
                <button
                  onClick={() => setTemplateEditorMainTab("edit")}
                  className={clsx(
                    "inline-flex min-w-[112px] items-center gap-2 px-5 text-[14px] font-semibold transition-colors",
                    templateEditorMainTab === "edit"
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
                  onClick={() => setTemplateEditorMainTab("preview")}
                  className={clsx(
                    "inline-flex min-w-[124px] items-center gap-2 px-5 text-[14px] font-semibold transition-colors",
                    templateEditorMainTab === "preview"
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
                  {templateEditorMainTab === "edit" && (
                    <label className="inline-flex h-7 w-52 items-center gap-2 rounded-md border border-[#687083] bg-transparent px-2.5 text-[12px] font-semibold text-[#a7acb8] transition-colors focus-within:border-[#9aa3b7] hover:bg-[#30343c]">
                      <span className="shrink-0 text-[12px] font-semibold text-[#8f96a6]">
                        Layout
                      </span>
                      <select
                        value={templateLayoutId ?? ""}
                        onChange={(e) => {
                          setTemplateLayoutId(e.target.value || null);
                          setDirty(true);
                        }}
                        className="min-w-0 flex-1 border-0 bg-transparent text-[12px] text-[#c9ced8] outline-none"
                        aria-label="Select layout"
                        title="Reusable email shell"
                      >
                        <option value="">No layout</option>
                        {layouts.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {/* {templateEditorMainTab === "preview" && (
                    <div className="flex items-center rounded-md border border-border bg-bg-subtle p-0.5 text-[12px]">
                      <button
                        onClick={() => setPreviewDevice("desktop")}
                        className={clsx(
                          "flex items-center gap-1.5 rounded px-2.5 py-1 font-medium transition-colors",
                          previewDevice === "desktop"
                            ? "bg-bg text-fg shadow-sm"
                            : "text-fg-muted hover:text-fg-secondary",
                        )}
                        aria-label="Desktop preview"
                      >
                        <Monitor className="h-3.5 w-3.5" />
                        Desktop
                      </button>
                      <button
                        onClick={() => setPreviewDevice("mobile")}
                        className={clsx(
                          "flex items-center gap-1.5 rounded px-2.5 py-1 font-medium transition-colors",
                          previewDevice === "mobile"
                            ? "bg-bg text-fg shadow-sm"
                            : "text-fg-muted hover:text-fg-secondary",
                        )}
                        aria-label="Mobile preview"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                        Mobile
                      </button>
                    </div>
                  )} */}

                  {templateEditorMainTab === "preview" && (
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
                  {templateEditorMainTab === "edit" && (
                    <button
                      onClick={() => void handleSendTest()}
                      disabled={isSendingTest}
                      className={clsx(
                        "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-semibold transition-colors",
                        isSendingTest
                          ? "cursor-not-allowed border-[#4a5060] bg-transparent text-[#727987]"
                          : "border-[#687083] bg-transparent text-[#a7acb8] hover:bg-[#30343c] hover:text-white",
                      )}
                      aria-label="Send test email"
                      title="Send Test Email"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {isSendingTest ? "Sending..." : "Send test"}
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

            <div
              id="tour-editor-code"
              className="relative min-h-0 flex-1 flex flex-col"
            >
              <div
                className={clsx(
                  "absolute inset-0 flex min-h-0 flex-col",
                  templateEditorMainTab !== "edit" &&
                    "invisible pointer-events-none",
                )}
                aria-hidden={templateEditorMainTab !== "edit"}
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
                    <button
                      className="inline-flex h-8 min-w-[92px] items-center justify-center gap-2 rounded-[4px] px-4 text-[13px] font-semibold text-[#8f96a6] opacity-80"
                      aria-label="Text editor disabled"
                      disabled
                    >
                      <span className="text-[#f7df4d]">!</span>
                      Text
                    </button>
                  </div>
                </div>
                <EditorPanel
                  htmlBody={htmlBody}
                  editorTabActive={templateEditorMainTab === "edit"}
                  onHtmlChange={(v: string) => {
                    setHtmlBody(v);
                    setDirty(true);
                  }}
                />
              </div>
              <div
                className={clsx(
                  "absolute inset-0 flex min-h-0 min-w-0 flex-1 bg-bg-subtle",
                  templateEditorMainTab !== "preview" &&
                    "invisible pointer-events-none",
                )}
                aria-hidden={templateEditorMainTab !== "preview"}
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

                    {/* Thay thế đoạn <iframe ... /> hiện tại */}
                    {previewDevice === "desktop" ? (
                      // Desktop: full width, không có gì bao ngoài
                      <iframe
                        srcDoc={previewSrcDoc}
                        sandbox="allow-same-origin"
                        title="Email Preview"
                        className="h-full min-h-0 flex-1 w-full border-0 bg-white"
                      />
                    ) : (
                      <div className="flex flex-1 min-h-0 items-start justify-center bg-bg-subtle overflow-auto">
                        <div className="my-6" style={{ width: 390 }}>
                          <div
                            className="relative rounded-[2.5rem] border-[6px] border-fg/20 shadow-2xl bg-white overflow-hidden flex flex-col"
                            // style={{ height: 700 }}
                          >
                            {/* Status bar */}
                            <div className="shrink-0 flex items-center justify-between px-5 pt-3 pb-1 bg-white">
                              <span className="text-[13px] font-semibold">
                                9:41
                              </span>
                              <div className="flex items-center gap-1 text-[11px]">
                                <span>▲▲▲</span>
                                <span>5G</span>
                                <span>🔋</span>
                              </div>
                            </div>

                            {/* Gmail toolbar — chỉ có border-b này thôi */}
                            <div className="shrink-0 flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200">
                              <span className="text-gray-600 text-lg">←</span>
                              <div className="flex items-center gap-4 text-gray-500">
                                <span className="text-base">⤓</span>
                                <span className="text-base">🗑</span>
                                <span className="text-base">✉</span>
                                <span className="text-base">⋯</span>
                              </div>
                            </div>

                            {/* Scrollable area — subject + sender + email content cuộn cùng nhau */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                              {/* Subject */}
                              <div className="px-4 pt-3 pb-2">
                                <div className="text-[15px] font-bold text-gray-900 leading-snug">
                                  {compiledSubject || "No subject"}
                                </div>
                              </div>

                              {/* Sender row — không có border */}
                              <div className="flex items-center justify-between px-4 py-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                                    P
                                  </div>
                                  <div>
                                    <div className="text-[13px] font-semibold text-gray-900">
                                      PreviewMail
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                      to me
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400 text-base">
                                  <span>🙂</span>
                                  <span>↩</span>
                                  <span>⋯</span>
                                </div>
                              </div>

                              {/* Email content — không cần height fixed, tự giãn theo nội dung */}
                              <div className="px-1">
                                <iframe
                                  srcDoc={previewSrcDoc}
                                  sandbox="allow-same-origin"
                                  title="Mobile Email Preview"
                                  className="w-full border-0 bg-white"
                                  style={{ height: 600, display: "block" }}
                                />
                              </div>
                            </div>

                            {/* Bottom action bar — fixed ở dưới, chỉ có border-t */}
                            <div className="shrink-0 flex items-center justify-around px-4 py-3 border-t border-gray-200 bg-white">
                              <button className="flex items-center gap-1.5 px-5 py-2 rounded-full border border-gray-200 text-[12px] text-gray-700">
                                ↩ Trả lời
                              </button>
                              <button className="flex items-center gap-1.5 px-5 py-2 rounded-full border border-gray-200 text-[12px] text-gray-700">
                                → Chuyển tiếp
                              </button>
                              <button className="p-2 rounded-full border border-gray-200 text-[12px] text-gray-500">
                                🙂
                              </button>
                            </div>

                            {/* Home indicator */}
                            <div className="shrink-0 flex justify-center py-1.5 bg-white">
                              <div className="h-1 w-20 rounded-full bg-gray-300" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
