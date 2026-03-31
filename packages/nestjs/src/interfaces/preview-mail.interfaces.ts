export interface Template {
  id: string;
  name: string;
  alias: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  mockData: Record<string, unknown>;
  layoutId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Layout {
  id: string;
  name: string;
  alias: string;
  htmlBody: string;
  textBody: string;
  createdAt: number;
  updatedAt: number;
}

export interface IPreviewMailAdapter {
  /**
   * Return a list of templates (metadata only or full), with pagination.
   */
  findAll(page?: number, limit?: number): Promise<Template[]>;

  /**
   * Return a single template by its unique alias.
   */
  findByAlias(alias: string): Promise<Template | null>;

  /**
   * Save (create or update) a template.
   */
  save(template: Template): Promise<Template>;

  /**
   * Delete a template by ID.
   */
  delete(id: string): Promise<void>;

  // Layouts
  findAllLayouts(page?: number, limit?: number): Promise<Layout[]>;
  findLayoutByAlias(alias: string): Promise<Layout | null>;
  saveLayout(layout: Layout): Promise<Layout>;
  deleteLayout(id: string): Promise<void>;
}

export interface PreviewMailOptions {
  /**
   * Static API Key for all incoming requests from the PreviewMail UI snippet.
   */
  apiKey: string;

  /**
   * Instance of a registered storage adapter (e.g., MongoosePreviewMailAdapter).
   */
  storage: IPreviewMailAdapter;

  /**
   * Permitted origins for CORS (e.g., ['https://previewmail.dev']).
   */
  allowedOrigins: string[];

  /**
   * LRU Cache configuration for findByAlias.
   */
  cache?: {
    ttl: number; // In milliseconds
    max: number; // Max number of items
  };

  /**
   * Optional rate-limiting configuration.
   * Note: This is an in-memory per-instance limiter and may bypass across distributed servers.
   */
  rateLimit?: {
    max: number;
    windowMs: number;
  };

  /**
   * Optional Audit Log enablement.
   */
  auditLog?: boolean;
}
