import { useCallback, useMemo, useRef } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { autoCloseTags, html } from "@codemirror/lang-html";
import { indentUnit } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { lintGutter } from "@codemirror/lint";
import { htmlLinter } from "@/lib/linter";
import type { EditorTab } from "@/types";

interface CodeEditorProps {
  value: string;
  tab: EditorTab;
  onChange: (value: string) => void;
}

const BASIC_SETUP = {
  lineNumbers: true,
  foldGutter: true,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
  autocompletion: true,
  closeBrackets: true,
  tabSize: 2,
};

export const CodeEditor = ({ value, tab, onChange }: CodeEditorProps) => {
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  const extensions = useMemo(
    () =>
      tab === "html"
        ? [
            html({
              autoCloseTags: true,
              matchClosingTags: true, // thêm dòng này
            }),
            autoCloseTags,
            indentUnit.of("  "),
            EditorView.lineWrapping,
            lintGutter(),
            htmlLinter,
          ]
        : [indentUnit.of("  "), EditorView.lineWrapping],
    [tab],
  );

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange],
  );

  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      <CodeMirror
        ref={editorRef}
        value={value}
        extensions={extensions}
        onChange={handleChange}
        theme="dark"
        className="h-full"
        basicSetup={BASIC_SETUP}
      />
    </div>
  );
};
