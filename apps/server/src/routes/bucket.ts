import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { BucketItem } from '../models/BucketItem';
import { createError } from '../middleware/errorHandler';

const router = Router();
router.use(protect);

// GET /api/bucket
router.get('/', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const { category } = req.query;
  const query: Record<string, unknown> = { coupleId: user.coupleId };
  if (category) query.category = category;

  const items = await BucketItem.find(query).sort({ createdAt: -1 });
  const total = items.length;
  const completed = items.filter((i) => i.isCompleted).length;

  res.json({ data: items, total, completed, progress: total > 0 ? Math.round((completed / total) * 100) : 0 });
});

// POST /api/bucket
router.post('/', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const { title, description, category, emoji } = req.body;
  if (!title) throw createError('Title is required', 400);

  const item = await BucketItem.create({
    coupleId: user.coupleId,
    title,
    description,
    category: category || 'experience',
    emoji,
  });

  res.status(201).json({ item });
});

// PATCH /api/bucket/:id — Update or toggle completion
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const { title, description, category, emoji, isCompleted } = req.body;

  const update: Record<string, unknown> = { title, description, category, emoji };
  if (typeof isCompleted === 'boolean') {
    update.isCompleted = isCompleted;
    update.completedAt = isCompleted ? new Date() : null;
  }

  const item = await BucketItem.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!item) throw createError('Item not found', 404);
  res.json({ item });
});

// DELETE /api/bucket/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await BucketItem.findByIdAndDelete(req.params.id);
  res.json({ message: 'Item deleted' });
});

export default router;
