import { useCallback, useEffect, useMemo, useRef } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { EditorSelection } from "@codemirror/state";
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
  editorTabActive?: boolean;
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

export const CodeEditor = ({
  value,
  tab,
  onChange,
  editorTabActive = true,
}: CodeEditorProps) => {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const savedSelectionRef = useRef<{ anchor: number; head: number } | null>(
    null,
  );

  useEffect(() => {
    const view = editorRef.current?.view;
    if (!editorTabActive) {
      if (view) {
        const main = view.state.selection.main;
        savedSelectionRef.current = { anchor: main.anchor, head: main.head };
      }
      return;
    }

    const id = requestAnimationFrame(() => {
      const v = editorRef.current?.view;
      if (!v) return;

      const saved = savedSelectionRef.current;
      if (saved) {
        const len = v.state.doc.length;
        const anchor = Math.min(Math.max(0, saved.anchor), len);
        const head = Math.min(Math.max(0, saved.head), len);
        v.dispatch({
          selection: EditorSelection.single(anchor, head),
          scrollIntoView: true,
        });
      }

      v.requestMeasure();
      v.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [editorTabActive]);

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
