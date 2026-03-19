import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import { lintGutter } from '@codemirror/lint';
import { clsx } from 'clsx';
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
  void htmlBody;
  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-3 py-2">
        {error && (
          <span className="inline-flex items-center rounded-md border border-danger/20 bg-danger/5 px-2 py-0.5 text-[11px] font-medium text-danger">
            {error}
          </span>
        )}
      </div>

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
          className="h-full bg-black"
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
            autocompletion: true,
            closeBrackets: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
};
