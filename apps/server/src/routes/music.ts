import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { UploadedTrack, Playlist, ListeningSession } from '../models/Music';
import { uploadAudio, uploadImage } from '../middleware/upload';
import { uploadToCloudinary } from '../config/cloudinary';
import { createError } from '../middleware/errorHandler';

const router = Router();
router.use(protect);

// ─── Tracks ───────────────────────────────────────────────────────────────────

// GET /api/music/songs
router.get('/songs', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const { search, favorite } = req.query;
  const query: Record<string, unknown> = { coupleId: user.coupleId };
  if (favorite === 'true') query.isFavorite = true;
  if (search) query.title = { $regex: search, $options: 'i' };

  const songs = await UploadedTrack.find(query)
    .populate('uploadedBy', 'name avatar')
    .sort({ createdAt: -1 });

  res.json({ data: songs });
});

// POST /api/music/songs — Upload a song
router.post('/songs', uploadAudio.single('audio'), async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);
  if (!req.file) throw createError('No audio file provided', 400);

  const { title, artist, album, duration } = req.body;
  if (!title) throw createError('Title is required', 400);

  const { url: fileUrl } = await uploadToCloudinary(req.file.buffer, 'music', 'video');

  const song = await UploadedTrack.create({
    coupleId: user.coupleId,
    uploadedBy: user._id,
    title,
    artist,
    album,
    duration: duration ? Number(duration) : undefined,
    fileUrl,
  });

  res.status(201).json({ song });
});

// PATCH /api/music/songs/:id/art — Upload album art
router.patch('/songs/:id/art', uploadImage.single('art'), async (req: AuthRequest, res: Response) => {
  if (!req.file) throw createError('No image provided', 400);

  const { url } = await uploadToCloudinary(req.file.buffer, 'album-art');
  const song = await UploadedTrack.findByIdAndUpdate(
    req.params.id,
    { albumArtUrl: url },
    { new: true }
  );
  res.json({ song });
});

// PATCH /api/music/songs/:id/favorite — Toggle favorite
router.patch('/songs/:id/favorite', async (req: AuthRequest, res: Response) => {
  const song = await UploadedTrack.findById(req.params.id);
  if (!song) throw createError('Song not found', 404);
  song.isFavorite = !song.isFavorite;
  await song.save();
  res.json({ isFavorite: song.isFavorite });
});

// DELETE /api/music/songs/:id
router.delete('/songs/:id', async (req: AuthRequest, res: Response) => {
  await UploadedTrack.findByIdAndDelete(req.params.id);
  res.json({ message: 'Song deleted' });
});

// ─── Playlists ────────────────────────────────────────────────────────────────

// GET /api/music/playlists
router.get('/playlists', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const playlists = await Playlist.find({ coupleId: user.coupleId })
    .populate({ path: 'tracks', select: 'title artist albumArtUrl duration' })
    .sort({ createdAt: -1 });

  res.json({ data: playlists });
});

// POST /api/music/playlists
router.post('/playlists', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const { name, description } = req.body;
  const playlist = await Playlist.create({ coupleId: user.coupleId, name, description });
  res.status(201).json({ playlist });
});

// PATCH /api/music/playlists/:id/tracks — Add/remove track
router.patch('/playlists/:id/tracks', async (req: AuthRequest, res: Response) => {
  const { trackId, action } = req.body; // action: 'add' | 'remove'
  const update = action === 'add'
    ? { $addToSet: { tracks: trackId } }
    : { $pull: { tracks: trackId } };

  const playlist = await Playlist.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ playlist });
});

// ─── Listening Session ────────────────────────────────────────────────────────

// GET /api/music/session
router.get('/session', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const session = await ListeningSession.findOne({ coupleId: user.coupleId });
  res.json({ session });
});

export default router;
