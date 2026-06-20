import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { Message } from '../models/Message';
import { uploadImage, uploadFile } from '../middleware/upload';
import { uploadToCloudinary } from '../config/cloudinary';
import { createError } from '../middleware/errorHandler';

const router = Router();
router.use(protect);

// GET /api/chat/messages?page=1&limit=40
router.get('/messages', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 40;
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ coupleId: user.coupleId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'name avatar'),
    Message.countDocuments({ coupleId: user.coupleId }),
  ]);

  res.json({
    data: messages.reverse(), // chronological order
    total,
    page,
    limit,
    hasMore: skip + messages.length < total,
  });
});

// POST /api/chat/upload/image — Upload image attachment
router.post('/upload/image', uploadImage.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) throw createError('No file provided', 400);

  const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'chat', 'image');
  res.json({ url, publicId });
});

// POST /api/chat/upload/voice — Upload voice note
router.post('/upload/voice', uploadFile.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) throw createError('No file provided', 400);

  const { url } = await uploadToCloudinary(req.file.buffer, 'voice', 'raw');
  res.json({ url });
});

// PATCH /api/chat/read/:messageId — Mark message as read
router.patch('/read/:messageId', async (req: AuthRequest, res: Response) => {
  const message = await Message.findByIdAndUpdate(
    req.params.messageId,
    { readAt: new Date() },
    { new: true }
  );
  if (!message) throw createError('Message not found', 404);
  res.json({ message });
});

export default router;
