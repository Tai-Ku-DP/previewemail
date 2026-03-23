import { useCallback, useEffect } from 'react';
import { CodeEditor } from './CodeEditor';
import { useEditorStore } from '@/stores/editorStore';

interface EditorPanelProps {
  htmlBody: string;
  onHtmlChange: (value: string) => void;
}

export const EditorPanel = ({
  htmlBody,
  onHtmlChange,
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
      <CodeEditor value={htmlBody} tab="html" onChange={handleChange} />
    </div>
  );
};
