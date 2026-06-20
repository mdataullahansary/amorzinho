import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import type { Mood } from '@amorzinho/shared';

export interface ICoupleDocument extends Document {
  user1: mongoose.Types.ObjectId;
  user2?: mongoose.Types.ObjectId;
  inviteCode: string;
  anniversaryDate?: Date;
  currentMood: {
    user1?: Mood;
    user2?: Mood;
  };
  createdAt: Date;
}

const CoupleSchema = new Schema<ICoupleDocument>(
  {
    user1: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    user2: { type: Schema.Types.ObjectId, ref: 'User' },
    inviteCode: {
      type: String,
      unique: true,
      default: () => uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase(),
    },
    anniversaryDate: { type: Date },
    currentMood: {
      user1: { type: String },
      user2: { type: String },
    },
  },
  { timestamps: true }
);

export const Couple = mongoose.model<ICoupleDocument>('Couple', CoupleSchema);
