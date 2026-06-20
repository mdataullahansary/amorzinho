import mongoose, { Document, Schema } from 'mongoose';

export interface IMovieSessionDocument extends Document {
  coupleId: mongoose.Types.ObjectId;
  videoUrl: string;
  title?: string;
  isPlaying: boolean;
  currentTime: number;
  lastSyncAt: Date;
  participants: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const MovieSessionSchema = new Schema<IMovieSessionDocument>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
    videoUrl: { type: String, required: true },
    title: { type: String },
    isPlaying: { type: Boolean, default: false },
    currentTime: { type: Number, default: 0 },
    lastSyncAt: { type: Date, default: Date.now },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const MovieSession = mongoose.model<IMovieSessionDocument>('MovieSession', MovieSessionSchema);
