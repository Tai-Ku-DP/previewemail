import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { clsx } from 'clsx';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTemplates } from '@/hooks/useTemplates';
import { useLayouts } from '@/hooks/useLayouts';

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { templates, createTemplate, deleteTemplate, isLoading } = useTemplates();
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [tab, setTab] = useState<'templates' | 'layouts'>('templates');
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
      (t) => t.name.toLowerCase().includes(q) || t.alias.toLowerCase().includes(q),
    );
  }, [templates, search]);

  const filteredLayouts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return layouts;
    return layouts.filter(
      (l) => l.name.toLowerCase().includes(q) || l.alias.toLowerCase().includes(q),
    );
  }, [layouts, search]);

  const handleCreateTemplate = async () => {
    try {
      const template = await createTemplate('Untitled Template', `template-${Date.now()}`);
      toast.success('Template created');
      navigate(`/templates/${template.id}`);
    } catch {
      toast.error('Failed to create template');
    }
  };

  const handleCreateLayout = async () => {
    try {
      const layout = await createLayout('Untitled Layout', `layout-${Date.now()}`);
      toast.success('Layout created');
      navigate(`/layouts/${layout.id}`);
    } catch {
      toast.error('Failed to create layout');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate(id);
      toast.success('Template deleted');
    } catch {
      toast.error('Failed to delete template');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleDeleteLayout = async (id: string) => {
    try {
      await deleteLayout(id);
      toast.success('Layout deleted');
    } catch {
      toast.error('Failed to delete layout');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const isTemplates = tab === 'templates';
  const items = isTemplates ? filteredTemplates : filteredLayouts;
  const loading = isTemplates ? isLoading : layoutsLoading;

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Toaster
        theme="system"
        position="bottom-right"
        toastOptions={{
          style: {
            fontSize: '13px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-subtle)',
            color: 'var(--color-fg)',
          },
        }}
      />

      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-bg px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-fg">PreviewMail</span>
          <span className="text-fg-faint">/</span>
          <span className="text-[13px] font-medium text-fg-secondary">
            {isTemplates ? 'Templates' : 'Layouts'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => void (isTemplates ? handleCreateTemplate() : handleCreateLayout())}
            className="inline-flex h-8 items-center rounded-md bg-fg px-3.5 text-[13px] font-medium text-bg transition-opacity hover:opacity-90"
          >
            New {isTemplates ? 'template' : 'layout'}
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-md border border-border bg-bg">
            <button
              onClick={() => {
                setTab('templates');
                setSearch('');
                setConfirmDeleteId(null);
              }}
              className={clsx(
                'h-8 px-3 text-xs font-medium transition-colors',
                tab === 'templates'
                  ? 'bg-bg-subtle text-fg'
                  : 'text-fg-muted hover:bg-bg-subtle hover:text-fg-secondary',
              )}
              aria-label="Templates tab"
            >
              Templates
            </button>
            <button
              onClick={() => {
                setTab('layouts');
                setSearch('');
                setConfirmDeleteId(null);
              }}
              className={clsx(
                'h-8 px-3 text-xs font-medium transition-colors',
                tab === 'layouts'
                  ? 'bg-bg-subtle text-fg'
                  : 'text-fg-muted hover:bg-bg-subtle hover:text-fg-secondary',
              )}
              aria-label="Layouts tab"
            >
              Layouts
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg">
              Your {isTemplates ? 'templates' : 'layouts'}
            </p>
            <p className="mt-0.5 text-xs text-fg-muted">
              Click a {isTemplates ? 'template' : 'layout'} to open the editor.
            </p>
          </div>
          <div className="w-[320px] max-w-full">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${isTemplates ? 'templates' : 'layouts'}...`}
                aria-label={`Search ${isTemplates ? 'templates' : 'layouts'}`}
                className="h-9 w-full rounded-md border border-border bg-bg pl-8 pr-3 text-xs text-fg placeholder:text-fg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-bg">
          {loading ? (
            <div className="p-4 text-xs text-fg-muted">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[13px] font-medium text-fg">
                No {isTemplates ? 'templates' : 'layouts'}
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                Create your first {isTemplates ? 'template' : 'layout'} to start editing.
              </p>
              <button
                onClick={() => void (isTemplates ? handleCreateTemplate() : handleCreateLayout())}
                className="mt-4 inline-flex h-8 items-center rounded-md bg-fg px-3.5 text-[13px] font-medium text-bg transition-opacity hover:opacity-90"
              >
                New {isTemplates ? 'template' : 'layout'}
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="group relative cursor-pointer px-4 py-3 transition-colors hover:bg-bg-subtle"
                  onClick={() =>
                    navigate(
                      isTemplates ? `/templates/${item.id}` : `/layouts/${item.id}`,
                    )
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-fg">
                        {item.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-fg-muted">
                        {item.alias}
                      </p>
                    </div>
                    {confirmDeleteId === item.id ? (
                      <div
                        className="flex items-center gap-1"
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
                    ) : (
                      <button
                        className={clsx(
                          'hidden h-7 items-center rounded-md px-2 text-[12px] font-medium text-fg-muted transition-colors hover:bg-bg-muted hover:text-danger',
                          'group-hover:inline-flex',
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(item.id);
                        }}
                        aria-label={`Delete ${item.name}`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

