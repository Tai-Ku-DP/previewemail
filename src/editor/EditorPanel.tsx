import { useCallback, useEffect, useState } from 'react';
import { CodeEditor } from './CodeEditor';
import { useEditorStore } from '@/stores/editorStore';
import { formatHtml } from '@/lib/formatter';
import { clsx } from 'clsx';

interface EditorPanelProps {
  htmlBody: string;
  onHtmlChange: (value: string) => void;
}

export const EditorPanel = ({
  htmlBody,
  onHtmlChange,
}: EditorPanelProps) => {
  const { editorMaximized, toggleEditorMaximized } = useEditorStore();
  const setDirty = useEditorStore((s) => s.setDirty);
  const [formatting, setFormatting] = useState(false);

  // Always keep the editor on HTML mode (Text tab removed).
  useEffect(() => {
    useEditorStore.getState().setEditorTab('html');
  }, []);

  const handleChange = useCallback(
    (val: string) => {
      onHtmlChange(val);
      setDirty(true);
    },
    [onHtmlChange, setDirty],
  );

  const handleFormat = useCallback(async () => {
    if (!htmlBody.trim()) return;
    setFormatting(true);
    try {
      const formatted = await formatHtml(htmlBody);
      onHtmlChange(formatted);
    } catch {
      // silently fail — raw HTML may contain Handlebars syntax that Prettier can't parse
    } finally {
      setFormatting(false);
    }
  }, [htmlBody, onHtmlChange]);

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex h-10 items-center justify-between border-b border-border px-2">
        <div className="flex items-end self-stretch">
          <span
            className={clsx(
              'relative h-full px-3 text-[13px] font-medium',
              'text-fg after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-fg',
            )}
          >
            HTML
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => void handleFormat()}
            disabled={formatting || !htmlBody.trim()}
            className={clsx(
              'inline-flex h-6 items-center gap-1.5 rounded-md border border-border px-2 text-[11px] font-medium transition-colors',
              formatting
                ? 'cursor-wait text-fg-muted'
                : 'text-fg-secondary hover:bg-bg-subtle hover:text-fg',
            )}
            aria-label="Format code"
            title="Format HTML (Shift+Alt+F)"
          >
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h2A1.5 1.5 0 0 1 7 3.5v1A1.5 1.5 0 0 1 5.5 6h-2A1.5 1.5 0 0 1 2 4.5v-1zm0 4A1.5 1.5 0 0 1 3.5 6h9A1.5 1.5 0 0 1 14 7.5v1A1.5 1.5 0 0 1 12.5 10h-9A1.5 1.5 0 0 1 2 8.5v-1zm0 4A1.5 1.5 0 0 1 3.5 10h5A1.5 1.5 0 0 1 10 11.5v1A1.5 1.5 0 0 1 8.5 14h-5A1.5 1.5 0 0 1 2 12.5v-1z" />
            </svg>
            {formatting ? 'Formatting…' : 'Format'}
          </button>

          <button
            onClick={toggleEditorMaximized}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
            aria-label={editorMaximized ? 'Exit fullscreen' : 'Fullscreen editor'}
            title={editorMaximized ? 'Exit fullscreen (Esc)' : 'Fullscreen editor'}
          >
            {editorMaximized ? (
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M6 2v4H2M10 14v-4h4M10 2v4h4M6 14v-4H2" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M2 6V2h4M14 10v4h-4M14 6V2h-4M2 10v4h4" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CodeEditor value={htmlBody} tab="html" onChange={handleChange} />
      </div>
    </div>
  );
};
