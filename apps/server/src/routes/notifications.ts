import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';
import { createError } from '../middleware/errorHandler';

const router = Router();
router.use(protect);

// GET /api/notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  const notifications = await Notification.find({ userId: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({ userId: req.user!._id, isRead: false });

  res.json({ data: notifications, unreadCount });
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  await Notification.updateMany({ userId: req.user!._id, isRead: false }, { isRead: true });
  res.json({ message: 'All notifications marked as read' });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw createError('Notification not found', 404);
  res.json({ notification });
});

export default router;
