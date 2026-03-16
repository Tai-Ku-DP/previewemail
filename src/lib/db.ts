import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Template, CreateTemplateInput, Layout, CreateLayoutInput, SESSettings } from '@/types';

interface EmailEditorDB extends DBSchema {
  templates: {
    key: string;
    value: Template;
    indexes: {
      'by-alias': string;
      'by-updatedAt': number;
    };
  };
  layouts: {
    key: string;
    value: Layout;
    indexes: {
      'by-alias': string;
      'by-updatedAt': number;
    };
  };
  settings: {
    key: string;
    value: { id: string; data: SESSettings };
  };
}

const DB_NAME = 'email-editor-db';
const DB_VERSION = 3;
const SETTINGS_KEY = 'ses-credentials';

let dbPromise: Promise<IDBPDatabase<EmailEditorDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<EmailEditorDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('templates', { keyPath: 'id' });
          store.createIndex('by-alias', 'alias', { unique: true });
          store.createIndex('by-updatedAt', 'updatedAt');
        }
        if (oldVersion < 2) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (oldVersion < 3) {
          const layoutStore = db.createObjectStore('layouts', { keyPath: 'id' });
          layoutStore.createIndex('by-alias', 'alias', { unique: true });
          layoutStore.createIndex('by-updatedAt', 'updatedAt');
        }
      },
    });
  }
  return dbPromise;
}

// ── Templates ──

export async function getAllTemplates(): Promise<Template[]> {
  try {
    const db = await getDB();
    return db.getAllFromIndex('templates', 'by-updatedAt');
  } catch (err: unknown) {
    console.error('Failed to get templates:', err);
    return [];
  }
}

export async function getTemplateById(id: string): Promise<Template | undefined> {
  try {
    const db = await getDB();
    return db.get('templates', id);
  } catch (err: unknown) {
    console.error('Failed to get template by id:', err);
    return undefined;
  }
}

export async function getTemplateByAlias(alias: string): Promise<Template | undefined> {
  try {
    const db = await getDB();
    return db.getFromIndex('templates', 'by-alias', alias);
  } catch (err: unknown) {
    console.error('Failed to get template by alias:', err);
    return undefined;
  }
}

export async function createTemplate(input: CreateTemplateInput): Promise<Template> {
  const now = Date.now();
  const template: Template = {
    id: crypto.randomUUID(),
    name: input.name,
    alias: input.alias,
    subject: input.subject ?? '',
    htmlBody: input.htmlBody ?? '',
    textBody: input.textBody ?? '',
    layoutId: input.layoutId ?? null,
    mockData: input.mockData ?? {},
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDB();
  await db.add('templates', template);
  return template;
}

export async function saveTemplate(template: Template): Promise<void> {
  try {
    const db = await getDB();
    await db.put('templates', { ...template, updatedAt: Date.now() });
  } catch (err: unknown) {
    console.error('Failed to save template:', err);
    throw err;
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('templates', id);
  } catch (err: unknown) {
    console.error('Failed to delete template:', err);
    throw err;
  }
}

// ── Layouts ──

export async function getAllLayouts(): Promise<Layout[]> {
  try {
    const db = await getDB();
    return db.getAllFromIndex('layouts', 'by-updatedAt');
  } catch (err: unknown) {
    console.error('Failed to get layouts:', err);
    return [];
  }
}

export async function getLayoutById(id: string): Promise<Layout | undefined> {
  try {
    const db = await getDB();
    return db.get('layouts', id);
  } catch (err: unknown) {
    console.error('Failed to get layout by id:', err);
    return undefined;
  }
}

export async function createLayout(input: CreateLayoutInput): Promise<Layout> {
  const now = Date.now();
  const layout: Layout = {
    id: crypto.randomUUID(),
    name: input.name,
    alias: input.alias,
    htmlBody: input.htmlBody ?? '',
    textBody: input.textBody ?? '',
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDB();
  await db.add('layouts', layout);
  return layout;
}

export async function saveLayout(layout: Layout): Promise<void> {
  try {
    const db = await getDB();
    await db.put('layouts', { ...layout, updatedAt: Date.now() });
  } catch (err: unknown) {
    console.error('Failed to save layout:', err);
    throw err;
  }
}

export async function deleteLayout(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('layouts', id);
  } catch (err: unknown) {
    console.error('Failed to delete layout:', err);
    throw err;
  }
}

// ── Settings ──

export async function getSESSettings(): Promise<SESSettings | null> {
  try {
    const db = await getDB();
    const row = await db.get('settings', SETTINGS_KEY);
    return row?.data ?? null;
  } catch (err: unknown) {
    console.error('Failed to get SES settings:', err);
    return null;
  }
}

export async function saveSESSettings(settings: SESSettings): Promise<void> {
  try {
    const db = await getDB();
    await db.put('settings', { id: SETTINGS_KEY, data: settings });
  } catch (err: unknown) {
    console.error('Failed to save SES settings:', err);
    throw err;
  }
}

export async function clearSESSettings(): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('settings', SETTINGS_KEY);
  } catch (err: unknown) {
    console.error('Failed to clear SES settings:', err);
    throw err;
  }
}
