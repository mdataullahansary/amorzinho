import mongoose, { Document, Schema } from 'mongoose';
import type { MemoryTag } from '@amorzinho/shared';

export interface IMemoryDocument extends Document {
  coupleId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  mediaItems: { url: string; type: 'photo' | 'video'; publicId?: string }[];
  tags: MemoryTag[];
  date: Date;
  createdAt: Date;
}

const MemorySchema = new Schema<IMemoryDocument>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    mediaItems: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ['photo', 'video'], default: 'photo' },
        publicId: { type: String },
      },
    ],
    tags: [
      {
        type: String,
        enum: ['trip', 'anniversary', 'date', 'random', 'milestone', 'birthday'],
      },
    ],
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

MemorySchema.index({ coupleId: 1, date: -1 });

export const Memory = mongoose.model<IMemoryDocument>('Memory', MemorySchema);
