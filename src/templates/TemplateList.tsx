import { useState, useMemo } from "react";
import { clsx } from "clsx";
import type { Template, Layout, SidebarTab } from "@/types";
import { useEditorStore } from "@/stores/editorStore";
import { FileText, LayoutDashboard, Plus, PanelLeftOpen, PanelLeftClose, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TemplateListProps {
  templates: Template[];
  layouts: Layout[];
  selectedTemplateId: string | null;
  selectedLayoutId: string | null;
  onSelectTemplate: (id: string) => void;
  onSelectLayout: (id: string) => void;
  onCreateTemplate: () => void;
  onCreateLayout: () => void;
  onDeleteTemplate: (id: string) => void;
  onDeleteLayout: (id: string) => void;
}

const SIDEBAR_TABS: { key: SidebarTab; label: string }[] = [
  { key: "templates", label: "Templates" },
  { key: "layouts", label: "Layouts" },
];

export const TemplateList = ({
  templates,
  layouts,
  selectedTemplateId,
  selectedLayoutId,
  onSelectTemplate,
  onSelectLayout,
  onCreateTemplate,
  onCreateLayout,
  onDeleteTemplate,
  onDeleteLayout,
}: TemplateListProps) => {
  const { sidebarTab, setSidebarTab, sidebarCollapsed, setSidebarCollapsed } =
    useEditorStore();
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.alias.toLowerCase().includes(q),
    );
  }, [templates, search]);

  const filteredLayouts = useMemo(() => {
    if (!search.trim()) return layouts;
    const q = search.toLowerCase();
    return layouts.filter(
      (l) =>
        l.name.toLowerCase().includes(q) || l.alias.toLowerCase().includes(q),
    );
  }, [layouts, search]);

  const isTemplates = sidebarTab === "templates";
  const items = isTemplates ? filteredTemplates : filteredLayouts;
  const selectedId = isTemplates ? selectedTemplateId : selectedLayoutId;
  const allItems = isTemplates ? templates : layouts;

  const handleSelect = (id: string) => {
    if (isTemplates) {
      onSelectTemplate(id);
    } else {
      onSelectLayout(id);
    }
  };

  const handleDelete = (id: string) => {
    if (isTemplates) {
      onDeleteTemplate(id);
    } else {
      onDeleteLayout(id);
    }
    setConfirmDeleteId(null);
  };

  const handleCreate = () => {
    if (isTemplates) {
      onCreateTemplate();
    } else {
      onCreateLayout();
    }
  };

  const handleTabChange = (tab: SidebarTab) => {
    setSidebarTab(tab);
    setSearch("");
    setConfirmDeleteId(null);
  };

  if (sidebarCollapsed) {
    const isTemplatesTab = sidebarTab === "templates";
    const count = isTemplatesTab ? templates.length : layouts.length;
    return (
      <div className="flex h-full flex-col items-center justify-between py-3">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => handleTabChange("templates")}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-md text-fg-muted transition-colors",
              sidebarTab === "templates"
                ? "bg-bg-subtle text-fg"
                : "hover:bg-bg-subtle hover:text-fg-secondary",
            )}
            aria-label="Templates"
            title="Templates"
          >
            <FileText className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleTabChange("layouts")}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-md text-fg-muted transition-colors",
              sidebarTab === "layouts"
                ? "bg-bg-subtle text-fg"
                : "hover:bg-bg-subtle hover:text-fg-secondary",
            )}
            aria-label="Layouts"
            title="Layouts"
          >
            <LayoutDashboard className="h-4 w-4" />
          </button>
          <span className="mt-1 rounded-full bg-bg-muted px-2 py-0.5 text-[10px] font-medium text-fg-muted">
            {count}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleCreate}
            aria-label={isTemplatesTab ? "New template" : "New layout"}
            title={isTemplatesTab ? "New template" : "New layout"}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-bg-muted text-fg-secondary transition-colors hover:bg-bg-inset hover:text-fg"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
          >
            <PanelLeftOpen className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sidebar tabs */}
      <div className="flex border-b border-border">
        {SIDEBAR_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={clsx(
              "relative flex-1 py-2 text-center text-[12px] font-medium transition-colors",
              sidebarTab === tab.key
                ? "text-fg after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-fg"
                : "text-fg-muted hover:text-fg-secondary",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Header with new button */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] text-fg-muted">
          {items.length} {isTemplates ? "template" : "layout"}
          {items.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCreate}
            aria-label={isTemplates ? "New template" : "New layout"}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-bg-muted px-2.5 text-xs font-medium text-fg-secondary transition-colors hover:bg-bg-inset hover:text-fg"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
          <button
            onClick={() => setSidebarCollapsed(true)}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            aria-label={`Filter ${sidebarTab}`}
            className="h-8 w-full rounded-md border border-border bg-bg pl-8 pr-3 text-xs text-fg placeholder:text-fg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto border-t border-border">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-bg-muted">
              {isTemplates ? (
                <FileText className="h-5 w-5 text-fg-muted" />
              ) : (
                <LayoutDashboard className="h-5 w-5 text-fg-muted" />
              )}
            </div>
            <p className="text-xs text-fg-muted">
              {allItems.length === 0 ? `No ${sidebarTab} yet` : "No matches"}
            </p>
          </div>
        ) : (
          <ul>
            {items.map((item) => (
              <li
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={clsx(
                  "group relative cursor-pointer border-b border-border-subtle px-3 py-2.5 transition-colors",
                  selectedId === item.id
                    ? "bg-accent-subtle"
                    : "hover:bg-bg-subtle",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={clsx(
                      "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                      selectedId === item.id ? "bg-accent" : "bg-fg-faint",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium leading-tight text-fg">
                      {item.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] leading-tight text-fg-muted">
                      {item.alias}
                    </p>
                  </div>
                </div>

                {confirmDeleteId === item.id ? (
                  <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="h-6 rounded-md bg-danger px-2 text-[11px] font-medium text-white transition-colors hover:bg-danger-hover"
                      aria-label="Confirm delete"
                    >
                      Delete
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(null);
                      }}
                      className="h-6 rounded-md bg-bg-muted px-2 text-[11px] font-medium text-fg-secondary transition-colors hover:bg-bg-inset"
                      aria-label="Cancel delete"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(item.id);
                    }}
                    className="absolute right-2 top-1/2 hidden h-6 -translate-y-1/2 items-center rounded-md px-1.5 text-fg-muted transition-colors hover:bg-bg-muted hover:text-danger group-hover:flex"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
