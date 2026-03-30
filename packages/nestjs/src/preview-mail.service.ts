import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPreviewMailAdapter, PreviewMailOptions, Template } from './interfaces/preview-mail.interfaces';
import { LRUCache } from 'lru-cache';
import { randomUUID } from 'crypto';

@Injectable()
export class PreviewMailService {
  private cache: LRUCache<string, Template> | null = null;
  private adapter: IPreviewMailAdapter;

  constructor(
    @Inject('PREVIEW_MAIL_OPTIONS') private options: PreviewMailOptions
  ) {
    this.adapter = options.storage;

    if (options.cache && options.cache.max > 0) {
      this.cache = new LRUCache<string, Template>({
        max: options.cache.max,
        ttl: options.cache.ttl,
      });
    }
  }

  async findAll(page: number = 1, limit: number = 50): Promise<Partial<Template>[]> {
    const templates = await this.adapter.findAll(page, limit);
    return templates.map(({ htmlBody, textBody, mockData, ...meta }) => meta);
  }

  async findByAlias(alias: string): Promise<Template | null> {
    if (this.cache && this.cache.has(alias)) {
      return this.cache.get(alias) || null;
    }

    const template = await this.adapter.findByAlias(alias);
    if (template && this.cache) {
      this.cache.set(alias, template);
    }

    return template;
  }

  async create(data: Partial<Template>): Promise<Template> {
    const now = Date.now();
    const newTemplate: Template = {
      id: randomUUID(),
      name: data.name || 'Untitled',
      alias: data.alias || randomUUID(),
      subject: data.subject || '',
      htmlBody: data.htmlBody || '',
      textBody: data.textBody || '',
      mockData: data.mockData || {},
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.adapter.save(newTemplate);
    if (this.cache) this.cache.delete(saved.alias);
    return saved;
  }

  async update(id: string, data: Partial<Template>): Promise<Template> {
    const existing = await this.adapter.findByAlias(data.alias || '');
    const now = Date.now();
    
    const updatedTemplate: Template = {
      ...(existing || {}),
      id,
      name: data.name!,
      alias: data.alias!,
      subject: data.subject!,
      htmlBody: data.htmlBody || existing?.htmlBody || '',
      textBody: data.textBody || existing?.textBody || '',
      mockData: data.mockData || existing?.mockData || {},
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const saved = await this.adapter.save(updatedTemplate);
    if (this.cache) this.cache.delete(saved.alias);
    return saved;
  }

  async delete(id: string): Promise<void> {
    // We do not know the alias for cache invalidation just from ID easily with this interface.
    // So if using cache aggressively, clear all cache on delete, or we search first.
    if (this.cache) this.cache.clear();
    await this.adapter.delete(id);
  }
}
