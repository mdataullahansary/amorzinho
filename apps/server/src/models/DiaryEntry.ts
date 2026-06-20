import mongoose, { Document, Schema } from 'mongoose';
import type { Mood } from '@amorzinho/shared';

export interface IDiaryEntryDocument extends Document {
  coupleId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  date: Date;
  title?: string;
  content: string;
  mood?: Mood;
  photos: string[];
  isShared: boolean;
  createdAt: Date;
}

const DiaryEntrySchema = new Schema<IDiaryEntryDocument>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    title: { type: String, trim: true },
    content: { type: String, required: true },
    mood: {
      type: String,
      enum: ['happy', 'sad', 'excited', 'anxious', 'grateful', 'in-love', 'tired', 'romantic'],
    },
    photos: [{ type: String }],
    isShared: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DiaryEntrySchema.index({ coupleId: 1, date: -1 });

export const DiaryEntry = mongoose.model<IDiaryEntryDocument>('DiaryEntry', DiaryEntrySchema);
