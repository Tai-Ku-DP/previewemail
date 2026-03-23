import { getAllTemplates, saveTemplate, getAllLayouts, saveLayout } from './db';
import type { Template, Layout } from '@/types';

export interface ExportData {
  exportedAt: string;
  templates: Template[];
  layouts: Layout[];
}

export async function exportData(): Promise<void> {
  const templates = await getAllTemplates();
  const layouts = await getAllLayouts();
  
  const data: ExportData = {
    exportedAt: new Date().toISOString(),
    templates,
    layouts,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'previewmail-export.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as Partial<ExportData>;
        
        if (!data.templates && !data.layouts) {
          throw new Error('Invalid export file format, missing templates/layouts arrays.');
        }

        if (Array.isArray(data.templates)) {
          for (const template of data.templates) {
            await saveTemplate(template);
          }
        }
        
        if (Array.isArray(data.layouts)) {
          for (const layout of data.layouts) {
            await saveLayout(layout);
          }
        }
        
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
