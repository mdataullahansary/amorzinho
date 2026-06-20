import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  googleId?: string;
  spotifyId?: string;
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
  coupleId?: mongoose.Types.ObjectId;
  isOnline: boolean;
  lastSeen?: Date;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    avatar: { type: String },
    googleId: { type: String, sparse: true, unique: true },
    spotifyId: { type: String, sparse: true, unique: true },
    spotifyAccessToken: { type: String },
    spotifyRefreshToken: { type: String },
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple' },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);
