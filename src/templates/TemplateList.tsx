import { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import type { Template, Layout, SidebarTab } from '@/types';
import { useEditorStore } from '@/stores/editorStore';

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
  { key: 'templates', label: 'Templates' },
  { key: 'layouts', label: 'Layouts' },
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
  const { sidebarTab, setSidebarTab, sidebarCollapsed, setSidebarCollapsed } = useEditorStore();
  const [search, setSearch] = useState('');
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

  const isTemplates = sidebarTab === 'templates';
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
    setSearch('');
    setConfirmDeleteId(null);
  };

  if (sidebarCollapsed) {
    const isTemplatesTab = sidebarTab === 'templates';
    const count = isTemplatesTab ? templates.length : layouts.length;
    return (
      <div className="flex h-full flex-col items-center justify-between py-3">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => handleTabChange('templates')}
            className={clsx(
              'flex h-8 w-8 items-center justify-center rounded-md text-fg-muted transition-colors',
              sidebarTab === 'templates'
                ? 'bg-bg-subtle text-fg'
                : 'hover:bg-bg-subtle hover:text-fg-secondary',
            )}
            aria-label="Templates"
            title="Templates"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </button>
          <button
            onClick={() => handleTabChange('layouts')}
            className={clsx(
              'flex h-8 w-8 items-center justify-center rounded-md text-fg-muted transition-colors',
              sidebarTab === 'layouts'
                ? 'bg-bg-subtle text-fg'
                : 'hover:bg-bg-subtle hover:text-fg-secondary',
            )}
            aria-label="Layouts"
            title="Layouts"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z" />
            </svg>
          </button>
          <span className="mt-1 rounded-full bg-bg-muted px-2 py-0.5 text-[10px] font-medium text-fg-muted">
            {count}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleCreate}
            aria-label={isTemplatesTab ? 'New template' : 'New layout'}
            title={isTemplatesTab ? 'New template' : 'New layout'}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-bg-muted text-fg-secondary transition-colors hover:bg-bg-inset hover:text-fg"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          <button
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M3 2.5v11m3-8 3 2.5L6 11.5" />
            </svg>
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
              'relative flex-1 py-2 text-center text-[12px] font-medium transition-colors',
              sidebarTab === tab.key
                ? 'text-fg after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-fg'
                : 'text-fg-muted hover:text-fg-secondary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Header with new button */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] text-fg-muted">
          {items.length} {isTemplates ? 'template' : 'layout'}{items.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCreate}
            aria-label={isTemplates ? 'New template' : 'New layout'}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-bg-muted px-2.5 text-xs font-medium text-fg-secondary transition-colors hover:bg-bg-inset hover:text-fg"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New
          </button>
          <button
            onClick={() => setSidebarCollapsed(true)}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M13 2.5v11M10 5.5 7 8l3 2.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
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
                <svg className="h-5 w-5 text-fg-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-fg-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z" />
                </svg>
              )}
            </div>
            <p className="text-xs text-fg-muted">
              {allItems.length === 0
                ? `No ${sidebarTab} yet`
                : 'No matches'}
            </p>
          </div>
        ) : (
          <ul>
            {items.map((item) => (
              <li
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={clsx(
                  'group relative cursor-pointer border-b border-border-subtle px-3 py-2.5 transition-colors',
                  selectedId === item.id
                    ? 'bg-accent-subtle'
                    : 'hover:bg-bg-subtle',
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={clsx(
                      'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                      selectedId === item.id ? 'bg-accent' : 'bg-fg-faint',
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
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="h-6 rounded-md bg-danger px-2 text-[11px] font-medium text-white transition-colors hover:bg-danger-hover"
                      aria-label="Confirm delete"
                    >
                      Delete
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                      className="h-6 rounded-md bg-bg-muted px-2 text-[11px] font-medium text-fg-secondary transition-colors hover:bg-bg-inset"
                      aria-label="Cancel delete"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(item.id); }}
                    className="absolute right-2 top-1/2 hidden h-6 -translate-y-1/2 items-center rounded-md px-1.5 text-fg-muted transition-colors hover:bg-bg-muted hover:text-danger group-hover:flex"
                    aria-label={`Delete ${item.name}`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
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
