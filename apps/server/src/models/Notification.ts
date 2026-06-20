import mongoose, { Document, Schema } from 'mongoose';
import type { NotificationType } from '@amorzinho/shared';

export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  coupleId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
    type: {
      type: String,
      enum: ['new_message', 'anniversary', 'memory_reminder', 'song_dedication', 'diary_update', 'bucket_completed', 'partner_online'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>('Notification', NotificationSchema);
