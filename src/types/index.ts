export interface Layout {
  id: string;
  name: string;
  alias: string;
  htmlBody: string;
  textBody: string;
  createdAt: number;
  updatedAt: number;
}

export interface Template {
  id: string;
  name: string;
  alias: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  layoutId: string | null;
  mockData: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export type CreateTemplateInput = Pick<Template, 'name' | 'alias'> &
  Partial<Omit<Template, 'id' | 'name' | 'alias' | 'createdAt' | 'updatedAt'>>;

export type CreateLayoutInput = Pick<Layout, 'name' | 'alias'> &
  Partial<Omit<Layout, 'id' | 'name' | 'alias' | 'createdAt' | 'updatedAt'>>;

export interface SESSettings {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  fromAddress: string;
}

export type EditorTab = 'html' | 'text';
export type TemplateEditorMainTab = 'edit' | 'preview';
export type RightPanelTab = 'preview' | 'mockdata';
export type PreviewWidth = 600 | 375;
export type SidebarTab = 'templates' | 'layouts';

export interface CompileResult {
  result: string | null;
  error: string | null;
}
