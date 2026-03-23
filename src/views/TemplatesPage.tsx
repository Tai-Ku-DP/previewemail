import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { clsx } from "clsx";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTemplates } from "@/hooks/useTemplates";
import { useLayouts } from "@/hooks/useLayouts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { templates, createTemplate, deleteTemplate, isLoading } =
    useTemplates();
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [tab, setTab] = useState<"templates" | "layouts">("templates");
  const {
    layouts,
    createLayout,
    deleteLayout,
    isLoading: layoutsLoading,
  } = useLayouts();

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.alias.toLowerCase().includes(q),
    );
  }, [templates, search]);

  const filteredLayouts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return layouts;
    return layouts.filter(
      (l) =>
        l.name.toLowerCase().includes(q) || l.alias.toLowerCase().includes(q),
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

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate(id);
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleDeleteLayout = async (id: string) => {
    try {
      await deleteLayout(id);
      toast.success("Layout deleted");
    } catch {
      toast.error("Failed to delete layout");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const isTemplates = tab === "templates";
  const items = isTemplates ? filteredTemplates : filteredLayouts;
  const loading = isTemplates ? isLoading : layoutsLoading;

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-fg">
              {row.original.name}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-fg-muted">
              {row.original.alias}
            </p>
          </div>
        ),
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
            <div className="flex justify-end">
              <button
                className={clsx(
                  "invisible h-7 items-center rounded-md px-2 text-[12px] font-medium text-fg-muted transition-colors hover:bg-bg-muted hover:text-danger",
                  "group-hover:visible inline-flex",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteId(item.id);
                }}
                aria-label={`Delete ${item.name}`}
              >
                Delete
              </button>
            </div>
          );
        },
      },
    ],
    [
      confirmDeleteId,
      isTemplates,
    ]
  );

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

      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-bg px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-fg">
            PreviewMail
          </span>
          <span className="text-fg-faint">/</span>
          <span className="text-[13px] font-medium text-fg-secondary">
            {isTemplates ? "Templates" : "Layouts"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
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



      <main className="mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col px-4 py-5">

        <div className="flex items-center gap-2 justify-between">
          <Tabs
            value={tab}
            onValueChange={(val) => {
              setTab(val as "templates" | "layouts");
              setSearch("");
              setConfirmDeleteId(null);
            }}
          >
            <TabsList className="h-9">
              <TabsTrigger value="templates" className="text-xs px-4">
                Templates
              </TabsTrigger>
              <TabsTrigger value="layouts" className="text-xs px-4">
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

        <div className="mt-4 min-h-0 flex-1 overflow-auto">
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
                navigate(isTemplates ? `/templates/${item.id}` : `/layouts/${item.id}`)
              }
              onQuickCreate={() => void (isTemplates ? handleCreateTemplate() : handleCreateLayout())}
              quickCreateLabel={`New ${isTemplates ? "template" : "layout"}`}
            />
          )}
        </div>
      </main>
    </div>
  );
}
