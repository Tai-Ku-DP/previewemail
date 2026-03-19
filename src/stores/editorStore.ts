import { create } from 'zustand';
import type { EditorTab, RightPanelTab, PreviewWidth, SidebarTab, TemplateEditorMainTab } from '@/types';

interface EditorStore {
  sidebarTab: SidebarTab;
  sidebarCollapsed: boolean;
  templateEditorMainTab: TemplateEditorMainTab;
  editorTab: EditorTab;
  rightPanelTab: RightPanelTab;
  previewWidth: PreviewWidth;
  previewMockDataOpen: boolean;
  previewSplit: number; // 0–1, fraction for preview panel (left)
  isDirty: boolean;
  editorMaximized: boolean;
  editorSplit: number; // 0–1, fraction for editor panel

  setSidebarTab: (tab: SidebarTab) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTemplateEditorMainTab: (tab: TemplateEditorMainTab) => void;
  toggleTemplateEditorMainTab: () => void;
  setEditorTab: (tab: EditorTab) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setPreviewWidth: (width: PreviewWidth) => void;
  togglePreviewMockData: () => void;
  setPreviewSplit: (split: number) => void;
  setDirty: (dirty: boolean) => void;
  setEditorSplit: (split: number) => void;
  toggleRightPanel: () => void;
  toggleEditorMaximized: () => void;
  setEditorMaximized: (maximized: boolean) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  sidebarTab: 'templates',
  sidebarCollapsed: false,
  templateEditorMainTab: 'edit',
  editorTab: 'html',
  rightPanelTab: 'preview',
  previewWidth: 600,
  previewMockDataOpen: true,
  previewSplit: 0.7,
  isDirty: false,
  editorMaximized: false,
  editorSplit: 0.5,

  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setTemplateEditorMainTab: (tab) => set({ templateEditorMainTab: tab }),
  toggleTemplateEditorMainTab: () =>
    set((s) => ({
      templateEditorMainTab: s.templateEditorMainTab === 'edit' ? 'preview' : 'edit',
    })),
  setEditorTab: (tab) => set({ editorTab: tab }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setPreviewWidth: (width) => set({ previewWidth: width }),
  togglePreviewMockData: () => set((s) => ({ previewMockDataOpen: !s.previewMockDataOpen })),
  setPreviewSplit: (split) =>
    set({
      previewSplit: Math.min(0.85, Math.max(0.4, split)),
    }),
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
