import { create } from 'zustand';
import type { EditorTab, RightPanelTab, PreviewWidth, SidebarTab } from '@/types';

interface EditorStore {
  sidebarTab: SidebarTab;
  editorTab: EditorTab;
  rightPanelTab: RightPanelTab;
  previewWidth: PreviewWidth;
  isDirty: boolean;
  editorMaximized: boolean;

  setSidebarTab: (tab: SidebarTab) => void;
  setEditorTab: (tab: EditorTab) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setPreviewWidth: (width: PreviewWidth) => void;
  setDirty: (dirty: boolean) => void;
  toggleRightPanel: () => void;
  toggleEditorMaximized: () => void;
  setEditorMaximized: (maximized: boolean) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  sidebarTab: 'templates',
  editorTab: 'html',
  rightPanelTab: 'preview',
  previewWidth: 600,
  isDirty: false,
  editorMaximized: false,

  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setEditorTab: (tab) => set({ editorTab: tab }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setPreviewWidth: (width) => set({ previewWidth: width }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  toggleRightPanel: () =>
    set((s) => ({
      rightPanelTab: s.rightPanelTab === 'preview' ? 'mockdata' : 'preview',
    })),
  toggleEditorMaximized: () => set((s) => ({ editorMaximized: !s.editorMaximized })),
  setEditorMaximized: (maximized) => set({ editorMaximized: maximized }),
}));
