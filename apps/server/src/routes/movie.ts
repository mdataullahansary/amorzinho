import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { MovieSession } from '../models/MovieSession';
import { createError } from '../middleware/errorHandler';

const router = Router();
router.use(protect);

// GET /api/movie/session/current
router.get('/session/current', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const session = await MovieSession.findOne({ coupleId: user.coupleId }).sort({ createdAt: -1 });
  res.json({ session });
});

// POST /api/movie/session — Start a new movie session
router.post('/session', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const { videoUrl, title } = req.body;
  if (!videoUrl) throw createError('Video URL is required', 400);

  const session = await MovieSession.create({
    coupleId: user.coupleId,
    videoUrl,
    title,
    participants: [user._id],
  });

  res.status(201).json({ session });
});

// DELETE /api/movie/session/:id — End session
router.delete('/session/:id', async (_req: AuthRequest, res: Response) => {
  await MovieSession.findByIdAndDelete(_req.params.id);
  res.json({ message: 'Session ended' });
});

export default router;
