import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { Message } from '../models/Message';
import { DiaryEntry } from '../models/DiaryEntry';
import { Memory } from '../models/Memory';
import { ListeningSession } from '../models/Music';
import { MovieSession } from '../models/MovieSession';
import { BucketItem } from '../models/BucketItem';
import { Couple } from '../models/Couple';
import { createError } from '../middleware/errorHandler';

const router = Router();
router.use(protect);

// GET /api/analytics
router.get('/', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const coupleId = user.coupleId;
  const couple = await Couple.findById(coupleId);
  if (!couple) throw createError('Couple not found', 404);

  const daysTogether = Math.floor(
    (Date.now() - new Date(couple.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const [messagesCount, diaryCount, memoriesCount, moviesCount, bucketItems] = await Promise.all([
    Message.countDocuments({ coupleId }),
    DiaryEntry.countDocuments({ coupleId }),
    Memory.countDocuments({ coupleId }),
    MovieSession.countDocuments({ coupleId }),
    BucketItem.find({ coupleId }),
  ]);

  // Messages by day (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const messagesByDay = await Message.aggregate([
    { $match: { coupleId, createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', count: 1 } },
  ]);

  // Top moods from diary
  const topMoods = await DiaryEntry.aggregate([
    { $match: { coupleId, mood: { $exists: true } } },
    { $group: { _id: '$mood', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, mood: '$_id', count: 1 } },
  ]);

  const bucketCompleted = bucketItems.filter((i) => i.isCompleted).length;

  res.json({
    daysTogether,
    messagesExchanged: messagesCount,
    songsListened: 0, // TODO: track in ListeningSession
    moviesWatched: moviesCount,
    memoriesCreated: memoriesCount,
    diaryEntries: diaryCount,
    bucketCompleted,
    bucketTotal: bucketItems.length,
    topMoods,
    messagesByDay,
  });
});

export default router;
