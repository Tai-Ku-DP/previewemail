import { create } from 'zustand';
import type { Layout } from '@/types';
import {
  getAllLayouts,
  createLayout as createLayoutInDB,
  saveLayout,
  deleteLayout as deleteLayoutFromDB,
} from '@/lib/db';

import { getV2Config } from '@/lib/config';
import { apiClient } from '@/lib/apiClient';

export type SyncStatus = 'synced' | 'local_only' | 'sync_failed';

interface LayoutStore {
  layouts: Layout[];
  selectedLayoutId: string | null;
  isLoading: boolean;
  syncStatus: SyncStatus;

  loadLayouts: () => Promise<void>;
  selectLayout: (id: string | null) => Promise<void>;
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
  syncStatus: 'local_only',

  loadLayouts: async () => {
    set({ isLoading: true });
    try {
      const localLayouts = await getAllLayouts();
      const config = await getV2Config();

      if (!config) {
        set({ layouts: localLayouts, syncStatus: 'local_only', isLoading: false });
        return;
      }

      // V2 Mode
      try {
        const apiLayouts = await apiClient.getLayouts(config, 1, 100);
        
        const synced = apiLayouts.map((apiMeta) => {
          const localMatch = localLayouts.find(l => l.alias === apiMeta.alias);
          return localMatch ? { ...localMatch, ...apiMeta } : apiMeta;
        });

        for (const l of synced) {
          if (!localLayouts.find(ll => ll.id === l.id)) {
             await saveLayout(l);
          }
        }

        set({ layouts: synced, syncStatus: 'synced', isLoading: false });
      } catch {
        set({ layouts: localLayouts, syncStatus: 'sync_failed', isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  selectLayout: async (id) => {
    set({ selectedLayoutId: id });
    const { layouts } = get();
    const config = await getV2Config();
    const active = layouts.find((l) => l.id === id);

    if (active && config && (!active.htmlBody || active.htmlBody === '')) {
      try {
        const fullLayout = await apiClient.getLayoutByAlias(config, active.alias);
        if (fullLayout && fullLayout.id) {
          await saveLayout(fullLayout);
          set((state) => ({
            layouts: state.layouts.map((l) => (l.id === id ? fullLayout : l)),
          }));
        }
      } catch (err) {
        console.error('Failed to lazy load full layout from API', err);
      }
    }
  },

  createLayout: async (name, alias) => {
    const config = await getV2Config();
    try {
      if (config) {
        const payload = { name, alias, htmlBody: '', textBody: '' } as Layout;
        const apiResponse = await apiClient.createLayout(config, payload);
        await saveLayout(apiResponse);
        set((state) => ({
          layouts: [...state.layouts, apiResponse],
          syncStatus: 'synced'
        }));
        return apiResponse;
      }
      
      const layout = await createLayoutInDB({ name, alias });
      set((state) => ({ layouts: [...state.layouts, layout], syncStatus: 'local_only' }));
      return layout;
    } catch {
      const layout = await createLayoutInDB({ name, alias });
      set((state) => ({ layouts: [...state.layouts, layout], syncStatus: 'sync_failed' }));
      return layout;
    }
  },

  updateLayout: async (id, updates) => {
    const { layouts } = get();
    const existing = layouts.find((l) => l.id === id);
    if (!existing) return;

    const updated: Layout = { ...existing, ...updates, updatedAt: Date.now() };
    const config = await getV2Config();

    try {
      if (config) {
        const apiResponse = await apiClient.updateLayout(config, id, updated);
        if (!apiResponse || !apiResponse.id) {
           throw new Error("Invalid API Response: missing layout ID");
        }
        await saveLayout(apiResponse);
        set((state) => ({
          layouts: state.layouts.map((l) => (l.id === id ? apiResponse : l)),
          syncStatus: 'synced'
        }));
        return;
      }
      
      await saveLayout(updated);
      set((state) => ({
        layouts: state.layouts.map((l) => (l.id === id ? updated : l)),
        syncStatus: 'local_only'
      }));
    } catch {
      await saveLayout(updated);
      set((state) => ({
        layouts: state.layouts.map((l) => (l.id === id ? updated : l)),
        syncStatus: 'sync_failed'
      }));
    }
  },

  deleteLayout: async (id) => {
    const config = await getV2Config();
    try {
      if (config) {
        await apiClient.deleteLayout(config, id);
        set({ syncStatus: 'synced' });
      } else {
        set({ syncStatus: 'local_only' });
      }
    } catch {
      set({ syncStatus: 'sync_failed' });
    }

    await deleteLayoutFromDB(id);
    set((state) => ({
      layouts: state.layouts.filter((l) => l.id !== id),
      selectedLayoutId: state.selectedLayoutId === id ? null : state.selectedLayoutId,
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
