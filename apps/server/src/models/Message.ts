import mongoose, { Document, Schema } from 'mongoose';
import type { MessageType } from '@amorzinho/shared';

export interface IMessageDocument extends Document {
  coupleId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  type: MessageType;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  reactions: { userId: mongoose.Types.ObjectId; emoji: string }[];
  readAt?: Date;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'voice'],
      default: 'text',
    },
    content: { type: String },
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    duration: { type: Number }, // voice note duration
    reactions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String },
      },
    ],
    readAt: { type: Date },
  },
  { timestamps: true }
);

// Index for efficient pagination
MessageSchema.index({ coupleId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessageDocument>('Message', MessageSchema);
