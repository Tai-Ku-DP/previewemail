import { IPreviewMailAdapter, Template } from '@previewmail/nestjs';
import mongoose, { Connection, Model } from 'mongoose';
import { TemplateSchema, TemplateDocument } from './template.schema';

export class MongoDBAdapter implements IPreviewMailAdapter {
  private connection: Connection;
  private templateModel: Model<TemplateDocument>;

  constructor(uri: string, options?: mongoose.ConnectOptions) {
    this.connection = mongoose.createConnection(uri, {
      maxPoolSize: 10,
      ...options,
    });
    this.templateModel = this.connection.model<TemplateDocument>('PreviewMailTemplate', TemplateSchema);
  }

  private mapToTemplate(doc: TemplateDocument): Template {
    return {
      id: doc.id,
      name: doc.name,
      alias: doc.alias,
      subject: doc.subject,
      htmlBody: doc.htmlBody,
      textBody: doc.textBody,
      mockData: doc.mockData,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async findAll(page: number = 1, limit: number = 50): Promise<Template[]> {
    const skip = (page - 1) * limit;
    const docs = await this.templateModel.find().skip(skip).limit(limit).exec();
    return docs.map(d => this.mapToTemplate(d));
  }

  async findByAlias(alias: string): Promise<Template | null> {
    const doc = await this.templateModel.findOne({ alias }).exec();
    return doc ? this.mapToTemplate(doc) : null;
  }

  async save(template: Template): Promise<Template> {
    const updated = await this.templateModel.findOneAndUpdate(
      { id: template.id },
      { $set: template },
      { new: true, upsert: true }
    ).exec();
    return this.mapToTemplate(updated);
  }

  async delete(id: string): Promise<void> {
    await this.templateModel.deleteOne({ id }).exec();
  }

  async disconnect(): Promise<void> {
    await this.connection.close();
  }
}
