import { useCallback, useEffect } from 'react';
import { CodeEditor } from './CodeEditor';
import { useEditorStore } from '@/stores/editorStore';

interface EditorPanelProps {
  htmlBody: string;
  onHtmlChange: (value: string) => void;
  /** When false, editor is hidden (e.g. Preview tab) but stays mounted to preserve cursor/scroll. */
  editorTabActive?: boolean;
}

export const EditorPanel = ({
  htmlBody,
  onHtmlChange,
  editorTabActive = true,
}: EditorPanelProps) => {
  const setDirty = useEditorStore((s) => s.setDirty);

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

  return (
    <div defaultValue="html" className="flex h-full flex-col bg-bg">
      <CodeEditor
        value={htmlBody}
        tab="html"
        onChange={handleChange}
        editorTabActive={editorTabActive}
      />
    </div>
  );
};
