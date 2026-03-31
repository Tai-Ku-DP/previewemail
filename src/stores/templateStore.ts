import { create } from 'zustand';
import type { Template } from '@/types';
import {
  getAllTemplates,
  createTemplate as createTemplateInDB,
  saveTemplate as saveTemplateToDB,
  deleteTemplate as deleteTemplateFromDB,
} from '@/lib/db';
import { getV2Config } from '@/lib/config';
import { apiClient } from '@/lib/apiClient';

export type SyncStatus = 'synced' | 'local_only' | 'sync_failed';

interface TemplateStore {
  templates: Template[];
  selectedTemplateId: string | null;
  isLoading: boolean;
  syncStatus: SyncStatus;

  loadTemplates: () => Promise<void>;
  selectTemplate: (id: string | null) => Promise<void>;
  createTemplate: (name: string, alias: string) => Promise<Template>;
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  getSelectedTemplate: () => Template | undefined;
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  selectedTemplateId: null,
  isLoading: false,
  syncStatus: 'local_only',

  loadTemplates: async () => {
    set({ isLoading: true });
    try {
      const localTemplates = await getAllTemplates();
      const config = await getV2Config();

      if (!config) {
        set({ templates: localTemplates, syncStatus: 'local_only', isLoading: false });
        return;
      }

      // V2 Mode: Fetch from API, reconcile with local
      try {
        const apiTemplates = await apiClient.getTemplates(config, 1, 100);
        
        // Merge API metadata with full body data from local, so we don't break V1 UI immediately
        const synced = apiTemplates.map((apiMeta: any) => {
          const localMatch = localTemplates.find(t => t.alias === apiMeta.alias);
          return localMatch ? { ...localMatch, ...apiMeta } : apiMeta;
        });

        // Save new API templates to local db cache
        for (const t of synced) {
          if (!localTemplates.find(lt => lt.id === t.id)) {
             await saveTemplateToDB(t);
          }
        }

        set({ templates: synced, syncStatus: 'synced', isLoading: false });
      } catch (err) {
        set({ templates: localTemplates, syncStatus: 'sync_failed', isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  selectTemplate: async (id) => {
    set({ selectedTemplateId: id });
    const { templates } = get();
    const config = await getV2Config();
    const active = templates.find((t) => t.id === id);

    if (active && config && (!active.htmlBody || active.htmlBody === '')) {
      // Lazy fetch full body from API
      try {
        const fullTemplate = await apiClient.getTemplateByAlias(config, active.alias);
        await saveTemplateToDB(fullTemplate); // update cache
        set((state) => ({
          templates: state.templates.map((t) => (t.id === id ? fullTemplate : t)),
        }));
      } catch (err) {
        console.error('Failed to lazy load full template from API', err);
      }
    }
  },

  createTemplate: async (name, alias) => {
    const config = await getV2Config();
    try {
      if (config) {
        const payload = { name, alias, subject: '', htmlBody: '', textBody: '', mockData: {} } as Template;
        const apiResponse = await apiClient.createTemplate(config, payload);
        await saveTemplateToDB(apiResponse); // local cache
        set((state) => ({
          templates: [...state.templates, apiResponse],
          syncStatus: 'synced'
        }));
        return apiResponse;
      }
      
      // V1 Mode
      const template = await createTemplateInDB({ name, alias });
      set((state) => ({ templates: [...state.templates, template], syncStatus: 'local_only' }));
      return template;
    } catch (err) {
      // Fallback
      const template = await createTemplateInDB({ name, alias });
      set((state) => ({ templates: [...state.templates, template], syncStatus: 'sync_failed' }));
      return template;
    }
  },

  updateTemplate: async (id, updates) => {
    const { templates } = get();
    const existing = templates.find((t) => t.id === id);
    if (!existing) return;

    const updated: Template = { ...existing, ...updates, updatedAt: Date.now() };
    const config = await getV2Config();

    try {
      if (config) {
        const apiResponse = await apiClient.updateTemplate(config, id, updated);
        await saveTemplateToDB(apiResponse);
        set((state) => ({
          templates: state.templates.map((t) => (t.id === id ? apiResponse : t)),
          syncStatus: 'synced'
        }));
        return;
      }
      
      // V1 Mode
      await saveTemplateToDB(updated);
      set((state) => ({
        templates: state.templates.map((t) => (t.id === id ? updated : t)),
        syncStatus: 'local_only'
      }));
    } catch (err) {
      // Sync failed, save to local anyway
      await saveTemplateToDB(updated);
      set((state) => ({
        templates: state.templates.map((t) => (t.id === id ? updated : t)),
        syncStatus: 'sync_failed'
      }));
    }
  },

  deleteTemplate: async (id) => {
    const config = await getV2Config();
    try {
      if (config) {
        await apiClient.deleteTemplate(config, id);
        set({ syncStatus: 'synced' });
      } else {
        set({ syncStatus: 'local_only' });
      }
    } catch (err) {
      set({ syncStatus: 'sync_failed' });
    }

    // Always delete local cache
    await deleteTemplateFromDB(id);
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
      selectedTemplateId: state.selectedTemplateId === id ? null : state.selectedTemplateId,
    }));
  },

  getSelectedTemplate: () => {
    const { templates, selectedTemplateId } = get();
    return templates.find((t) => t.id === selectedTemplateId);
  },
}));
