import { useCallback, useEffect, useState } from 'react';
import { CodeEditor } from './CodeEditor';
import { useEditorStore } from '@/stores/editorStore';
import { formatHtml } from '@/lib/formatter';
import { clsx } from 'clsx';
import { Paintbrush, Maximize, Minimize } from 'lucide-react';

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
    <div defaultValue="html" className="flex h-full flex-col bg-bg">
      <div className="flex h-12 items-center justify-between border-b border-border px-4 py-2">

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
            <Paintbrush className="h-3.5 w-3.5" />
            {formatting ? 'Formatting…' : 'Format'}
          </button>

          <button
            onClick={toggleEditorMaximized}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
            aria-label={editorMaximized ? 'Exit fullscreen' : 'Fullscreen editor'}
            title={editorMaximized ? 'Exit fullscreen (Esc)' : 'Fullscreen editor'}
          >
            {editorMaximized ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <CodeEditor value={htmlBody} tab="html" onChange={handleChange} />
    </div>
  );
};
