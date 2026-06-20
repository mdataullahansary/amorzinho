import mongoose, { Document, Schema } from 'mongoose';
import type { BucketCategory } from '@amorzinho/shared';

export interface IBucketItemDocument extends Document {
  coupleId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: BucketCategory;
  emoji?: string;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
}

const BucketItemSchema = new Schema<IBucketItemDocument>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    category: {
      type: String,
      enum: ['travel', 'experience', 'milestone', 'fun'],
      default: 'experience',
    },
    emoji: { type: String },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const BucketItem = mongoose.model<IBucketItemDocument>('BucketItem', BucketItemSchema);
