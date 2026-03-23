import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { EditorView } from "@codemirror/view";
import { lintGutter } from "@codemirror/lint";
import { clsx } from "clsx";
import { jsonLinter } from "@/lib/linter";

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
    <div className="flex h-screen flex-col bg-bg">
      <div
        className={clsx(
          "min-h-0 flex-1 overflow-hidden transition-shadow",
          error ? "ring-1 ring-danger/40 ring-inset" : "",
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
