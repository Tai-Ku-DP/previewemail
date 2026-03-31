import { Schema, Document } from 'mongoose';
import { Layout } from '@previewmail/nestjs';

export interface LayoutDocument extends Omit<Layout, 'id'>, Document {
  id: string;
}

export const LayoutSchema = new Schema<LayoutDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  alias: { type: String, required: true, unique: true },
  htmlBody: { type: String, default: '' },
  textBody: { type: String, default: '' },
  createdAt: { type: Number, required: true },
  updatedAt: { type: Number, required: true },
});

LayoutSchema.index({ alias: 1 });
