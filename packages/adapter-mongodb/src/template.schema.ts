import { Schema, Document } from 'mongoose';
import { Template } from '@previewmail/nestjs';

export interface TemplateDocument extends Omit<Template, 'id'>, Document {
  id: string;
}

export const TemplateSchema = new Schema<TemplateDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  alias: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  htmlBody: { type: String, default: '' },
  textBody: { type: String, default: '' },
  mockData: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Number, required: true },
  updatedAt: { type: Number, required: true },
});

TemplateSchema.index({ alias: 1 });
