import { create } from 'zustand';
import type { Template } from '@/types';
import {
  getAllTemplates,
  createTemplate as createTemplateInDB,
  saveTemplate,
  deleteTemplate as deleteTemplateFromDB,
} from '@/lib/db';

interface TemplateStore {
  templates: Template[];
  selectedTemplateId: string | null;
  isLoading: boolean;

  loadTemplates: () => Promise<void>;
  selectTemplate: (id: string | null) => void;
  createTemplate: (name: string, alias: string) => Promise<Template>;
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  getSelectedTemplate: () => Template | undefined;
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  selectedTemplateId: null,
  isLoading: false,

  loadTemplates: async () => {
    set({ isLoading: true });
    try {
      const templates = await getAllTemplates();
      set({ templates, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  selectTemplate: (id) => {
    set({ selectedTemplateId: id });
  },

  createTemplate: async (name, alias) => {
    const template = await createTemplateInDB({ name, alias });
    set((state) => ({ templates: [...state.templates, template] }));
    return template;
  },

  updateTemplate: async (id, updates) => {
    const { templates } = get();
    const existing = templates.find((t) => t.id === id);
    if (!existing) return;

    const updated: Template = { ...existing, ...updates };
    await saveTemplate(updated);
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...updated, updatedAt: Date.now() } : t,
      ),
    }));
  },

  deleteTemplate: async (id) => {
    await deleteTemplateFromDB(id);
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
      selectedTemplateId:
        state.selectedTemplateId === id ? null : state.selectedTemplateId,
    }));
  },

  getSelectedTemplate: () => {
    const { templates, selectedTemplateId } = get();
    return templates.find((t) => t.id === selectedTemplateId);
  },
}));
