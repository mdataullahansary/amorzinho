import mongoose, { Document, Schema } from 'mongoose';

export interface IUploadedTrackDocument extends Document {
  coupleId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  fileUrl: string;
  albumArtUrl?: string;
  playCount: number;
  isFavorite: boolean;
  createdAt: Date;
}

const UploadedTrackSchema = new Schema<IUploadedTrackDocument>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    artist: { type: String, trim: true },
    album: { type: String, trim: true },
    duration: { type: Number },
    fileUrl: { type: String, required: true },
    albumArtUrl: { type: String },
    playCount: { type: Number, default: 0 },
    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const UploadedTrack = mongoose.model<IUploadedTrackDocument>('UploadedTrack', UploadedTrackSchema);

// ─── Playlist ─────────────────────────────────────────────────────────────────

export interface IPlaylistDocument extends Document {
  coupleId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  coverUrl?: string;
  tracks: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const PlaylistSchema = new Schema<IPlaylistDocument>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    coverUrl: { type: String },
    tracks: [{ type: Schema.Types.ObjectId, ref: 'UploadedTrack' }],
  },
  { timestamps: true }
);

export const Playlist = mongoose.model<IPlaylistDocument>('Playlist', PlaylistSchema);

// ─── Listening Session ────────────────────────────────────────────────────────

export interface IListeningSessionDocument extends Document {
  coupleId: mongoose.Types.ObjectId;
  trackId: string;
  trackType: 'spotify' | 'uploaded';
  isPlaying: boolean;
  position: number;
  volume: number;
  participants: mongoose.Types.ObjectId[];
  updatedAt: Date;
}

const ListeningSessionSchema = new Schema<IListeningSessionDocument>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, unique: true },
    trackId: { type: String, required: true },
    trackType: { type: String, enum: ['spotify', 'uploaded'], default: 'uploaded' },
    isPlaying: { type: Boolean, default: false },
    position: { type: Number, default: 0 },
    volume: { type: Number, default: 80 },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const ListeningSession = mongoose.model<IListeningSessionDocument>('ListeningSession', ListeningSessionSchema);
