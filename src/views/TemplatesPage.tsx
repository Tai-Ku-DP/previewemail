/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { clsx } from "clsx";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { AppTour } from "@/components/AppTour";
import { useTemplates } from "@/hooks/useTemplates";
import { useLayouts } from "@/hooks/useLayouts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, Upload, MoreHorizontal } from "lucide-react";
import { exportData, importData } from "@/lib/exportImport";
import { useTemplateStore } from "@/stores/templateStore";
import { useLayoutStore } from "@/stores/layoutStore";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { StorageIndicator } from "@/components/StorageIndicator";
import { compileTemplate, compileWithLayout } from "@/lib/handlebars";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";
import { useSettings } from "@/hooks/useSettings";
import { useV2Config } from "@/hooks/useV2Config";

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

function TablePreviewThumb({
  item,
  isTemplate,
  layouts,
}: {
  item: any;
  isTemplate: boolean;
  layouts: any[];
}) {
  const html = useMemo(() => {
    if (!isTemplate) return item.htmlBody;
    const layout = item.layoutId
      ? layouts.find((l) => l.id === item.layoutId)
      : null;
    if (layout) {
      return (
        compileWithLayout(item.htmlBody, layout.htmlBody, item.mockData || {})
          .result ?? ""
      );
    }
    return compileTemplate(item.htmlBody, item.mockData || {}).result ?? "";
  }, [item, isTemplate, layouts]);

  return (
    <div className="h-14 w-24 overflow-hidden rounded-md border border-border bg-white relative shrink-0 shadow-sm">
      <div
        style={{
          width: "480px",
          height: "280px",
          transform: "scale(0.2)",
          transformOrigin: "top left",
        }}
        className="absolute"
      >
        <iframe
          srcDoc={wrapIframeSrcDoc(html)}
          className="w-full h-full border-0 pointer-events-none"
          tabIndex={-1}
          scrolling="no"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const navigate = useNavigate();
  const {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    isLoading,
  } = useTemplates();
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab =
    (searchParams.get("tab") as "templates" | "layouts") || "templates";
  const setActiveTab = (val: "templates" | "layouts") => {
    setSearchParams(
      (prev) => {
        prev.set("tab", val);
        return prev;
      },
      { replace: true },
    );
  };
  const {
    layouts,
    createLayout,
    updateLayout,
    deleteLayout,
    isLoading: layoutsLoading,
  } = useLayouts();

  const loadTemplates = useTemplateStore((s) => s.loadTemplates);
  const syncStatus = useTemplateStore((s) => s.syncStatus);
  const loadLayouts = useLayoutStore((s) => s.loadLayouts);
  const { settings, save: saveSettings, clear: clearSettings } = useSettings();
  const { config: v2Config, save: saveV2Config, clear: clearV2Config } = useV2Config();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      await exportData();
      toast.success("Data exported successfully");
    } catch {
      toast.error("Failed to export data");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      await importData(file);
      await loadTemplates();
      await loadLayouts();
      toast.success("Data imported successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to import data");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.alias || "").toLowerCase().includes(q),
    );
  }, [templates, search]);

  const filteredLayouts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return layouts;
    return layouts.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.alias || "").toLowerCase().includes(q),
    );
  }, [layouts, search]);

  const handleCreateTemplate = async () => {
    try {
      const template = await createTemplate(
        "Untitled Template",
        `template-${Date.now()}`,
      );
      toast.success("Template created");
      navigate(`/templates/${template.id}`);
    } catch {
      toast.error("Failed to create template");
    }
  };

  const handleCreateLayout = async () => {
    try {
      const layout = await createLayout(
        "Untitled Layout",
        `layout-${Date.now()}`,
      );
      toast.success("Layout created");
      navigate(`/layouts/${layout.id}`);
    } catch {
      toast.error("Failed to create layout");
    }
  };

  const handleDeleteTemplate = useCallback(
    async (id: string) => {
      try {
        await deleteTemplate(id);
        toast.success("Template deleted");
      } catch {
        toast.error("Failed to delete template");
      } finally {
        setConfirmDeleteId(null);
      }
    },
    [deleteTemplate],
  );

  const handleDeleteLayout = useCallback(
    async (id: string) => {
      try {
        await deleteLayout(id);
        toast.success("Layout deleted");
      } catch {
        toast.error("Failed to delete layout");
      } finally {
        setConfirmDeleteId(null);
      }
    },
    [deleteLayout],
  );

  const handleDuplicateTemplate = useCallback(
    async (template: any) => {
      try {
        const newTemplate = await createTemplate(
          `${template.name} (Copy)`,
          `${template.alias}-copy-${Date.now()}`,
        );
        await updateTemplate(newTemplate.id, {
          htmlBody: template.htmlBody,
          textBody: template.textBody,
          subject: template.subject,
          layoutId: template.layoutId,
          mockData: template.mockData,
        });
        toast.success("Template duplicated");
      } catch {
        toast.error("Failed to duplicate template");
      }
    },
    [createTemplate, updateTemplate],
  );

  const handleDuplicateLayout = useCallback(
    async (layout: any) => {
      try {
        const newLayout = await createLayout(
          `${layout.name} (Copy)`,
          `${layout.alias}-copy-${Date.now()}`,
        );
        await updateLayout(newLayout.id, {
          htmlBody: layout.htmlBody,
          textBody: layout.textBody,
        });
        toast.success("Layout duplicated");
      } catch {
        toast.error("Failed to duplicate layout");
      }
    },
    [createLayout, updateLayout],
  );

  const handleTabChange = useCallback(
    (val: string) => {
      setActiveTab(val as "templates" | "layouts");
      setSearch("");
      setConfirmDeleteId(null);
    },
    [setActiveTab],
  );

  const isTemplates = activeTab === "templates";
  const items = isTemplates ? filteredTemplates : filteredLayouts;
  const loading = isTemplates ? isLoading : layoutsLoading;

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const item = row.original;
          const layout =
            isTemplates && item.layoutId
              ? layouts.find((l) => l.id === item.layoutId)
              : null;

          return (
            <div className="flex items-center gap-4 min-w-0 py-1">
              <TablePreviewThumb
                item={item}
                isTemplate={isTemplates}
                layouts={layouts}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-medium text-fg">
                  {item.name}
                </p>
                <div className="mt-1 flex items-center gap-2 truncate text-[12px] text-fg-muted">
                  <span className="truncate">{item.alias}</span>
                  {layout && (
                    <>
                      <span className="text-border">&bull;</span>
                      <span className="truncate text-fg-secondary">
                        Layout: {layout.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const item = row.original;
          if (confirmDeleteId === item.id) {
            return (
              <div
                className="flex items-center justify-end gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() =>
                    void (isTemplates
                      ? handleDeleteTemplate(item.id)
                      : handleDeleteLayout(item.id))
                  }
                  className="h-7 rounded-md bg-danger px-2.5 text-[12px] font-medium text-white transition-colors hover:bg-danger-hover"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="h-7 rounded-md bg-bg-muted px-2.5 text-[12px] font-medium text-fg-secondary transition-colors hover:bg-bg-inset"
                >
                  Cancel
                </button>
              </div>
            );
          }

          return (
            <div
              className="flex justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg">
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(
                        isTemplates
                          ? `/templates/${item.id}`
                          : `/layouts/${item.id}`,
                      )
                    }
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (isTemplates) {
                        void handleDuplicateTemplate(item);
                      } else {
                        void handleDuplicateLayout(item);
                      }
                    }}
                  >
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-danger focus:text-danger focus:bg-danger/10"
                    onClick={() => setConfirmDeleteId(item.id)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [
      confirmDeleteId,
      isTemplates,
      handleDuplicateTemplate,
      handleDuplicateLayout,
      handleDeleteTemplate,
      handleDeleteLayout,
      navigate,
      layouts,
    ],
  );

  return (
    <div className="flex min-h-screen flex-col bg-bg">
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

      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-bg px-4">
        <div className="flex items-center gap-2">
          <Logo />
        </div>

        <div className="flex items-center gap-1.5">
          <div className="hidden sm:block">
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
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleExport}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-bg px-3 text-[13px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
            title="Export data"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className={clsx(
              "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-bg px-3 text-[13px] font-medium transition-colors",
              isImporting
                ? "cursor-wait text-fg-muted opacity-60"
                : "text-fg-secondary hover:bg-bg-subtle hover:text-fg",
            )}
            title="Import data"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => void handleImport(e)}
            accept=".json"
            className="hidden"
          />
          <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
          <AppTour />
          <button
            id="tour-library-btn"
            onClick={() => navigate("/library")}
            className="inline-flex h-8 items-center rounded-md border border-border bg-bg px-3.5 text-[13px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg mr-1"
          >
            Library
          </button>
          <button
            id="tour-new-btn"
            onClick={() =>
              void (isTemplates ? handleCreateTemplate() : handleCreateLayout())
            }
            className="inline-flex h-8 items-center rounded-md bg-fg px-3.5 text-[13px] font-medium text-bg transition-opacity hover:opacity-90"
          >
            New {isTemplates ? "template" : "layout"}
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-5 pb-20">
        <div className="flex items-center gap-2 justify-between">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="h-9">
              <TabsTrigger
                id="tour-templates-tab"
                value="templates"
                className="text-xs px-4"
              >
                Templates
              </TabsTrigger>
              <TabsTrigger
                id="tour-layouts-tab"
                value="layouts"
                className="text-xs px-4"
              >
                Layouts
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="w-[320px] max-w-full">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${isTemplates ? "templates" : "layouts"}...`}
                aria-label={`Search ${isTemplates ? "templates" : "layouts"}`}
                className="h-9 w-full rounded-md border border-border bg-bg pl-8 pr-3 text-xs text-fg placeholder:text-fg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 w-full">
          {loading ? (
            <div className="p-4 text-xs text-fg-muted">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[13px] font-medium text-fg">
                No {isTemplates ? "templates" : "layouts"}
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                Create your first {isTemplates ? "template" : "layout"} to start
                editing.
              </p>
              <button
                onClick={() =>
                  void (isTemplates
                    ? handleCreateTemplate()
                    : handleCreateLayout())
                }
                className="mt-4 inline-flex h-8 items-center rounded-md bg-fg px-3.5 text-[13px] font-medium text-bg transition-opacity hover:opacity-90"
              >
                New {isTemplates ? "template" : "layout"}
              </button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={items}
              onRowClick={(item) =>
                navigate(
                  isTemplates ? `/templates/${item.id}` : `/layouts/${item.id}`,
                )
              }
              onQuickCreate={() =>
                void (isTemplates
                  ? handleCreateTemplate()
                  : handleCreateLayout())
              }
              quickCreateLabel={`New ${isTemplates ? "template" : "layout"}`}
            />
          )}
        </div>
      </main>
    </div>
  );
}
