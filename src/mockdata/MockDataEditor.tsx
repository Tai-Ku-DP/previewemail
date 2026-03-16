import { useMemo, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import { lintGutter } from '@codemirror/lint';
import { clsx } from 'clsx';
import { extractVariables } from '@/lib/handlebars';
import { formatJson } from '@/lib/formatter';
import { jsonLinter } from '@/lib/linter';

interface MockDataEditorProps {
  value: string;
  htmlBody: string;
  onChange: (value: string) => void;
  error: string | null;
}

const extensions = [json(), EditorView.lineWrapping, lintGutter(), jsonLinter];

export const MockDataEditor = ({
  value,
  htmlBody,
  onChange,
  error,
}: MockDataEditorProps) => {
  const detectedVars = useMemo(() => extractVariables(htmlBody), [htmlBody]);

  const handleAutoFill = useCallback(() => {
    let current: Record<string, unknown> = {};
    try {
      current = JSON.parse(value) as Record<string, unknown>;
    } catch {
      current = {};
    }

    const filled = { ...current };
    for (const v of detectedVars) {
      if (!(v in filled)) {
        filled[v] = null;
      }
    }
    onChange(JSON.stringify(filled, null, 2));
  }, [value, detectedVars, onChange]);

  const handleFormat = useCallback(() => {
    try {
      const formatted = formatJson(value);
      onChange(formatted);
    } catch {
      // can't format invalid JSON
    }
  }, [value, onChange]);

  const missingCount = useMemo(() => {
    let current: Record<string, unknown> = {};
    try {
      current = JSON.parse(value) as Record<string, unknown>;
    } catch {
      return detectedVars.length;
    }
    return detectedVars.filter((v) => !(v in current)).length;
  }, [value, detectedVars]);

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-3 py-2">
        {error && (
          <span className="inline-flex items-center rounded-md border border-danger/20 bg-danger/5 px-2 py-0.5 text-[11px] font-medium text-danger">
            {error}
          </span>
        )}

        {detectedVars.length > 0 && (
          <span className="inline-flex items-center rounded-md border border-accent/20 bg-accent-subtle px-2 py-0.5 text-[11px] font-medium text-accent">
            {detectedVars.length} variable{detectedVars.length !== 1 && 's'}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={handleFormat}
            className="inline-flex h-6 items-center gap-1 rounded-md border border-border px-2 text-[11px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
            aria-label="Format JSON"
          >
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h2A1.5 1.5 0 0 1 7 3.5v1A1.5 1.5 0 0 1 5.5 6h-2A1.5 1.5 0 0 1 2 4.5v-1zm0 4A1.5 1.5 0 0 1 3.5 6h9A1.5 1.5 0 0 1 14 7.5v1A1.5 1.5 0 0 1 12.5 10h-9A1.5 1.5 0 0 1 2 8.5v-1zm0 4A1.5 1.5 0 0 1 3.5 10h5A1.5 1.5 0 0 1 10 11.5v1A1.5 1.5 0 0 1 8.5 14h-5A1.5 1.5 0 0 1 2 12.5v-1z" />
            </svg>
            Format
          </button>

          {missingCount > 0 && (
            <button
              onClick={handleAutoFill}
              className="inline-flex h-6 items-center rounded-md border border-border px-2 text-[11px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
              aria-label="Auto-fill missing keys"
            >
              Fill {missingCount} missing
            </button>
          )}
        </div>
      </div>

      {detectedVars.length > 0 && (
        <div className="flex flex-wrap gap-1 border-b border-border px-3 py-1.5">
          {detectedVars.map((v) => (
            <code
              key={v}
              className="rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-fg-muted"
            >
              {`{{${v}}}`}
            </code>
          ))}
        </div>
      )}

      <div
        className={clsx(
          'min-h-0 flex-1 transition-shadow',
          error ? 'ring-1 ring-danger/40 ring-inset' : '',
        )}
      >
        <CodeMirror
          value={value}
          extensions={extensions}
          onChange={onChange}
          theme="dark"
          className="h-full"
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            autocompletion: true,
            closeBrackets: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
};
