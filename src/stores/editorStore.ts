import { create } from 'zustand';
import type { EditorTab, RightPanelTab, PreviewWidth, SidebarTab } from '@/types';

interface EditorStore {
  sidebarTab: SidebarTab;
  sidebarCollapsed: boolean;
  editorTab: EditorTab;
  rightPanelTab: RightPanelTab;
  previewWidth: PreviewWidth;
  isDirty: boolean;
  editorMaximized: boolean;
  editorSplit: number; // 0–1, fraction for editor panel

  setSidebarTab: (tab: SidebarTab) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setEditorTab: (tab: EditorTab) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setPreviewWidth: (width: PreviewWidth) => void;
  setDirty: (dirty: boolean) => void;
  setEditorSplit: (split: number) => void;
  toggleRightPanel: () => void;
  toggleEditorMaximized: () => void;
  setEditorMaximized: (maximized: boolean) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  sidebarTab: 'templates',
  sidebarCollapsed: false,
  editorTab: 'html',
  rightPanelTab: 'preview',
  previewWidth: 600,
  isDirty: false,
  editorMaximized: false,
  editorSplit: 0.5,

  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setEditorTab: (tab) => set({ editorTab: tab }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setPreviewWidth: (width) => set({ previewWidth: width }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  setEditorSplit: (split) =>
    set({
      editorSplit: Math.min(0.8, Math.max(0.2, split)),
    }),
  toggleRightPanel: () =>
    set((s) => ({
      rightPanelTab: s.rightPanelTab === 'preview' ? 'mockdata' : 'preview',
    })),
  toggleEditorMaximized: () => set((s) => ({ editorMaximized: !s.editorMaximized })),
  setEditorMaximized: (maximized) => set({ editorMaximized: maximized }),
}));
