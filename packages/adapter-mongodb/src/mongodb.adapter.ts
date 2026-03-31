import { IPreviewMailAdapter, Template, Layout } from "@previewmail/nestjs";
import mongoose, { Connection, Model } from "mongoose";
import { TemplateSchema, TemplateDocument } from "./template.schema";
import { LayoutSchema, LayoutDocument } from "./layout.schema";

export class MongoDBAdapter implements IPreviewMailAdapter {
  private connection: Connection;
  private templateModel: Model<TemplateDocument>;
  private layoutModel: Model<LayoutDocument>;

  constructor(uri: string, options: mongoose.ConnectOptions = {}) {
    this.connection = mongoose.createConnection(uri, {
      maxPoolSize: 10,
      ...options,
    });
    this.templateModel = this.connection.model<TemplateDocument>(
      "PreviewMailTemplate",
      TemplateSchema,
    );
    this.layoutModel = this.connection.model<LayoutDocument>(
      "PreviewMailLayout",
      LayoutSchema,
    );
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
      layoutId: doc.layoutId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async findAll(page: number = 1, limit: number = 50): Promise<Template[]> {
    const skip = (page - 1) * limit;
    const docs = await this.templateModel.find().skip(skip).limit(limit).exec();

    console.log("docs", docs);
    return docs.map((d) => this.mapToTemplate(d));
  }

  async findByAlias(alias: string): Promise<Template | null> {
    const doc = await this.templateModel.findOne({ alias }).exec();
    return doc ? this.mapToTemplate(doc) : null;
  }

  async save(template: Template): Promise<Template> {
    const updated = await this.templateModel
      .findOneAndUpdate(
        { id: template.id },
        { $set: template },
        { new: true, upsert: true },
      )
      .exec();

    return this.mapToTemplate(updated);
  }

  async delete(id: string): Promise<void> {
    await this.templateModel.deleteOne({ id }).exec();
  }

  // --- Layout Operations ---

  private mapToLayout(doc: LayoutDocument): Layout {
    return {
      id: doc.id,
      name: doc.name,
      alias: doc.alias,
      htmlBody: doc.htmlBody,
      textBody: doc.textBody,
      createdAt: doc.createdAt || Date.now(),
      updatedAt: doc.updatedAt || Date.now(),
    };
  }

  async findAllLayouts(page: number = 1, limit: number = 50): Promise<Layout[]> {
    const skip = (page - 1) * limit;
    const docs = await this.layoutModel.find().skip(skip).limit(limit).exec();
    return docs.map((d) => this.mapToLayout(d));
  }

  async findLayoutByAlias(alias: string): Promise<Layout | null> {
    const doc = await this.layoutModel.findOne({ alias }).exec();
    return doc ? this.mapToLayout(doc) : null;
  }

  async saveLayout(layout: Layout): Promise<Layout> {
    const updated = await this.layoutModel
      .findOneAndUpdate(
        { id: layout.id },
        { $set: layout },
        { new: true, upsert: true },
      )
      .exec();
    return this.mapToLayout(updated);
  }

  async deleteLayout(id: string): Promise<void> {
    await this.layoutModel.deleteOne({ id }).exec();
  }

  async disconnect(): Promise<void> {
    await this.connection.close();
  }
}
