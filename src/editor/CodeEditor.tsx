import { useCallback, useMemo, useRef } from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { indentUnit } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { lintGutter } from '@codemirror/lint';
import { htmlLinter } from '@/lib/linter';
import type { EditorTab } from '@/types';

interface CodeEditorProps {
  value: string;
  tab: EditorTab;
  onChange: (value: string) => void;
}

export const CodeEditor = ({ value, tab, onChange }: CodeEditorProps) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  const extensions = useMemo(
    () =>
      tab === 'html'
        ? [html({ autoCloseTags: true }), indentUnit.of('  '), EditorView.lineWrapping, lintGutter(), htmlLinter]
        : [indentUnit.of('  '), EditorView.lineWrapping],
    [tab],
  );

  const handleChange = useCallback(
    (val: string) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onChange(val), 200);
    },
    [onChange],
  );

  return (
    <CodeMirror
      ref={editorRef}
      value={value}
      extensions={extensions}
      onChange={handleChange}
      theme="dark"
      className="h-full"
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        autocompletion: true,
        closeBrackets: true,
        tabSize: 2,
      }}
    />
  );
};
