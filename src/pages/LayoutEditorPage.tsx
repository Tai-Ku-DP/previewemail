import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { clsx } from 'clsx';
import { ThemeToggle } from '@/components/ThemeToggle';
import { EditorPanel } from '@/editor/EditorPanel';
import { useLayouts } from '@/hooks/useLayouts';
import { useEditorStore } from '@/stores/editorStore';
import { formatHtml } from '@/lib/formatter';

export default function LayoutEditorPage() {
  const navigate = useNavigate();
  const { layoutId } = useParams<{ layoutId: string }>();

  const { layouts, selectedLayout, selectLayout, updateLayout } = useLayouts();

  const isDirty = useEditorStore((s) => s.isDirty);
  const setDirty = useEditorStore((s) => s.setDirty);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [layoutName, setLayoutName] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [textBody, setTextBody] = useState('');
  const [justSaved, setJustSaved] = useState(false);

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
      setDirty(false);
    });
  }, [selectedLayout, setDirty]);

  const handleSaveLayout = useCallback(async (overrides?: { htmlBody?: string }) => {
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
      toast.success('Layout saved');
      setDirty(false);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2000);
    } catch {
      toast.error('Failed to save layout');
    }
  }, [selectedLayout, updateLayout, layoutName, htmlBody, textBody, setDirty]);

  const saveInProgress = useRef(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (saveInProgress.current) return;
        saveInProgress.current = true;
        const editorTab = useEditorStore.getState().editorTab;
        const save = async () => {
          if (editorTab === 'html' && htmlBody.trim()) {
            try {
              const formatted = await formatHtml(htmlBody);
              await handleSaveLayout({ htmlBody: formatted });
              return;
            } catch {
              // fallthrough: save raw
            }
          }
          await handleSaveLayout();
        };
        void save().finally(() => {
          saveInProgress.current = false;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSaveLayout, htmlBody]);

  useEffect(() => {
    if (!isDirty) {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
      return;
    }

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      if (saveInProgress.current) return;
      saveInProgress.current = true;
      void handleSaveLayout().finally(() => {
        saveInProgress.current = false;
      });
    }, 4000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    };
  }, [isDirty, handleSaveLayout, layoutName, htmlBody, textBody]);

  if (!layoutId) return <Navigate to="/templates" replace />;
  const layoutExists = layouts.some((l) => l.id === layoutId);
  if (!layoutExists && layouts.length > 0) return <Navigate to="/templates" replace />;

  const isEditingLayout = Boolean(selectedLayout);

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
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            onClick={() => navigate('/templates')}
            className="inline-flex h-8 items-center rounded-md px-2.5 text-[13px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
            aria-label="Back to templates"
          >
            ← Templates
          </button>

          {isEditingLayout && (
            <>
              <span className="text-fg-faint">/</span>
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
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isEditingLayout && (
            <button
              onClick={() => void handleSaveLayout()}
              className={clsx(
                'inline-flex h-8 items-center rounded-md px-3.5 text-[13px] font-medium transition-opacity',
                isDirty
                  ? 'bg-fg text-bg hover:opacity-90'
                  : 'border border-border bg-bg text-fg-secondary hover:bg-bg-subtle hover:text-fg',
              )}
              aria-label="Save layout"
              title="Save (Ctrl+S / Cmd+S)"
            >
              {justSaved && !isDirty ? 'Saved ✓' : 'Save'}
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <div className="min-h-0 flex-1">
        {isEditingLayout ? (
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
          <div className="p-4 text-xs text-fg-muted">Loading…</div>
        )}
      </div>
    </div>
  );
}

