import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Couple } from '../models/Couple';
import { createError } from '../middleware/errorHandler';

const router = Router();

router.use(protect);

// POST /api/couple/create — Create a couple space (user becomes user1)
router.post('/create', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (user.coupleId) throw createError('You are already part of a couple space', 409);

  const { anniversaryDate } = req.body;

  const couple = await Couple.create({
    user1: user._id,
    anniversaryDate: anniversaryDate ? new Date(anniversaryDate) : undefined,
  });

  user.coupleId = couple._id as any;
  await user.save();

  res.status(201).json({ couple });
});

// POST /api/couple/join — Join using invite code
router.post('/join', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (user.coupleId) throw createError('You are already part of a couple space', 409);

  const { inviteCode } = req.body;
  if (!inviteCode) throw createError('Invite code is required', 400);

  const couple = await Couple.findOne({ inviteCode: inviteCode.toUpperCase() });
  if (!couple) throw createError('Invalid invite code', 404);
  if (couple.user2) throw createError('This couple space is already full', 409);
  if (couple.user1.toString() === user._id.toString()) {
    throw createError('You cannot join your own couple space', 400);
  }

  couple.user2 = user._id as any;
  await couple.save();

  user.coupleId = couple._id as any;
  await user.save();

  const populated = await Couple.findById(couple._id)
    .populate('user1', 'name email avatar isOnline')
    .populate('user2', 'name email avatar isOnline');

  res.json({ couple: populated });
});

// GET /api/couple/me — Get couple info with both users
router.get('/me', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('You are not part of a couple space', 404);

  const couple = await Couple.findById(user.coupleId)
    .populate('user1', 'name email avatar isOnline lastSeen')
    .populate('user2', 'name email avatar isOnline lastSeen');

  if (!couple) throw createError('Couple not found', 404);

  // Calculate days together
  const daysTogether = Math.floor(
    (Date.now() - new Date(couple.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  res.json({ couple, daysTogether });
});

// PATCH /api/couple/mood — Update current user's mood
router.patch('/mood', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const { mood } = req.body;
  const couple = await Couple.findById(user.coupleId);
  if (!couple) throw createError('Couple not found', 404);

  const isUser1 = couple.user1.toString() === user._id.toString();
  if (isUser1) {
    couple.currentMood.user1 = mood;
  } else {
    couple.currentMood.user2 = mood;
  }
  await couple.save();

  res.json({ currentMood: couple.currentMood });
});

// PATCH /api/couple/note — Update daily note
router.patch('/note', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const { note } = req.body;
  await Couple.findByIdAndUpdate(user.coupleId, { dailyNote: note });

  res.json({ message: 'Daily note updated' });
});

// PATCH /api/couple/anniversary — Set anniversary date
router.patch('/anniversary', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const { anniversaryDate } = req.body;
  await Couple.findByIdAndUpdate(user.coupleId, { anniversaryDate: new Date(anniversaryDate) });

  res.json({ message: 'Anniversary date updated' });
});

// GET /api/couple/invite — Get invite code
router.get('/invite', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!user.coupleId) throw createError('Not in a couple space', 404);

  const couple = await Couple.findById(user.coupleId).select('inviteCode user2');
  if (!couple) throw createError('Couple not found', 404);
  if (couple.user2) throw createError('Couple space is already full', 409);

  res.json({ inviteCode: couple.inviteCode });
});

export default router;
