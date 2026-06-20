import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { Memory } from '../models/Memory';
import { uploadImage } from '../middleware/upload';
import { uploadToCloudinary, cloudinary } from '../config/cloudinary';
import { createError } from '../middleware/errorHandler';

const router = Router();
router.use(protect);

// GET /api/memories?tag=trip&year=2026
router.get('/', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const { tag, year, month } = req.query;
  const query: Record<string, unknown> = { coupleId: user.coupleId };

  if (tag) query.tags = tag;
  if (year) {
    const y = Number(year);
    if (month) {
      const m = Number(month);
      query.date = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
    } else {
      query.date = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
    }
  }

  const memories = await Memory.find(query).sort({ date: -1 });
  res.json({ data: memories });
});

// GET /api/memories/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const memory = await Memory.findById(req.params.id);
  if (!memory) throw createError('Memory not found', 404);
  res.json({ memory });
});

// POST /api/memories
router.post('/', uploadImage.array('media', 10), async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const { title, description, tags, date } = req.body;
  if (!title) throw createError('Title is required', 400);

  const files = req.files as Express.Multer.File[];
  const mediaItems = await Promise.all(
    (files || []).map(async (f) => {
      const resourceType = f.mimetype.startsWith('video/') ? 'video' : 'image';
      const { url, publicId } = await uploadToCloudinary(f.buffer, 'memories', resourceType);
      return { url, publicId, type: resourceType as 'photo' | 'video' };
    })
  );

  const memory = await Memory.create({
    coupleId: user.coupleId,
    title,
    description,
    mediaItems,
    tags: tags ? JSON.parse(tags) : [],
    date: date ? new Date(date) : new Date(),
  });

  res.status(201).json({ memory });
});

// PATCH /api/memories/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const { title, description, tags } = req.body;
  const memory = await Memory.findByIdAndUpdate(
    req.params.id,
    { title, description, tags: tags ? JSON.parse(tags) : undefined },
    { new: true }
  );
  if (!memory) throw createError('Memory not found', 404);
  res.json({ memory });
});

// DELETE /api/memories/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const memory = await Memory.findById(req.params.id);
  if (!memory) throw createError('Memory not found', 404);

  // Delete from Cloudinary
  await Promise.all(
    memory.mediaItems
      .filter((m) => m.publicId)
      .map((m) => cloudinary.uploader.destroy(m.publicId!, { resource_type: m.type === 'video' ? 'video' : 'image' }))
  );

  await memory.deleteOne();
  res.json({ message: 'Memory deleted' });
});

export default router;
