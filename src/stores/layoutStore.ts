import { create } from 'zustand';
import type { Layout } from '@/types';
import {
  getAllLayouts,
  createLayout as createLayoutInDB,
  saveLayout,
  deleteLayout as deleteLayoutFromDB,
} from '@/lib/db';

interface LayoutStore {
  layouts: Layout[];
  selectedLayoutId: string | null;
  isLoading: boolean;

  loadLayouts: () => Promise<void>;
  selectLayout: (id: string | null) => void;
  createLayout: (name: string, alias: string) => Promise<Layout>;
  updateLayout: (id: string, updates: Partial<Layout>) => Promise<void>;
  deleteLayout: (id: string) => Promise<void>;
  getSelectedLayout: () => Layout | undefined;
  getLayoutById: (id: string) => Layout | undefined;
}

export const useLayoutStore = create<LayoutStore>((set, get) => ({
  layouts: [],
  selectedLayoutId: null,
  isLoading: false,

  loadLayouts: async () => {
    set({ isLoading: true });
    try {
      const layouts = await getAllLayouts();
      set({ layouts, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  selectLayout: (id) => {
    set({ selectedLayoutId: id });
  },

  createLayout: async (name, alias) => {
    const layout = await createLayoutInDB({ name, alias });
    set((state) => ({ layouts: [...state.layouts, layout] }));
    return layout;
  },

  updateLayout: async (id, updates) => {
    const { layouts } = get();
    const existing = layouts.find((l) => l.id === id);
    if (!existing) return;

    const updated: Layout = { ...existing, ...updates };
    await saveLayout(updated);
    set((state) => ({
      layouts: state.layouts.map((l) =>
        l.id === id ? { ...updated, updatedAt: Date.now() } : l,
      ),
    }));
  },

  deleteLayout: async (id) => {
    await deleteLayoutFromDB(id);
    set((state) => ({
      layouts: state.layouts.filter((l) => l.id !== id),
      selectedLayoutId:
        state.selectedLayoutId === id ? null : state.selectedLayoutId,
    }));
  },

  getSelectedLayout: () => {
    const { layouts, selectedLayoutId } = get();
    return layouts.find((l) => l.id === selectedLayoutId);
  },

  getLayoutById: (id: string) => {
    const { layouts } = get();
    return layouts.find((l) => l.id === id);
  },
}));
