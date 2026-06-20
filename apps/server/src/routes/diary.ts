import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { DiaryEntry } from '../models/DiaryEntry';
import { uploadImage } from '../middleware/upload';
import { uploadToCloudinary } from '../config/cloudinary';
import { createError } from '../middleware/errorHandler';

const router = Router();
router.use(protect);

// GET /api/diary?month=2026-06
router.get('/', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const { month, year } = req.query;
  const query: Record<string, unknown> = { coupleId: user.coupleId };

  if (month) {
    const [y, m] = (month as string).split('-').map(Number);
    query.date = {
      $gte: new Date(y, m - 1, 1),
      $lt: new Date(y, m, 1),
    };
  } else if (year) {
    const y = Number(year);
    query.date = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
  }

  const entries = await DiaryEntry.find(query)
    .populate('authorId', 'name avatar')
    .sort({ date: -1 });

  res.json({ data: entries });
});

// GET /api/diary/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const entry = await DiaryEntry.findById(req.params.id).populate('authorId', 'name avatar');
  if (!entry) throw createError('Entry not found', 404);
  res.json({ entry });
});

// POST /api/diary
router.post('/', uploadImage.array('photos', 5), async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const { date, title, content, mood, isShared } = req.body;
  if (!content) throw createError('Content is required', 400);

  const files = req.files as Express.Multer.File[];
  const photoUrls = await Promise.all(
    (files || []).map((f) => uploadToCloudinary(f.buffer, 'diary').then((r) => r.url))
  );

  const entry = await DiaryEntry.create({
    coupleId: user.coupleId,
    authorId: user._id,
    date: date ? new Date(date) : new Date(),
    title,
    content,
    mood,
    photos: photoUrls,
    isShared: isShared !== 'false',
  });

  res.status(201).json({ entry });
});

// PATCH /api/diary/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const { title, content, mood, isShared } = req.body;

  const entry = await DiaryEntry.findOneAndUpdate(
    { _id: req.params.id, authorId: req.user!._id },
    { title, content, mood, isShared },
    { new: true }
  );

  if (!entry) throw createError('Entry not found or unauthorized', 404);
  res.json({ entry });
});

// DELETE /api/diary/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await DiaryEntry.findOneAndDelete({ _id: req.params.id, authorId: req.user!._id });
  res.json({ message: 'Entry deleted' });
});

export default router;
