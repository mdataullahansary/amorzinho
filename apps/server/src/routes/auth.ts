import { Router, Response } from 'express';
import passport from 'passport';
import { User } from '../models/User';
import { Couple } from '../models/Couple';
import { protect, signToken, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
router.post('/register', async (req, res: Response) => {
  const body = registerSchema.parse(req.body);

  const exists = await User.findOne({ email: body.email });
  if (exists) throw createError('Email already in use', 409);

  const user = await User.create(body);
  const token = signToken(user._id.toString());

  res.status(201).json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      coupleId: user.coupleId,
    },
  });
});

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  const body = loginSchema.parse(req.body);

  const user = await User.findOne({ email: body.email }).select('+password');
  if (!user || !(await user.comparePassword(body.password))) {
    throw createError('Invalid email or password', 401);
  }

  const token = signToken(user._id.toString());

  res.json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      coupleId: user.coupleId,
    },
  });
});

// GET /api/auth/me
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  let couple = null;

  if (user.coupleId) {
    couple = await Couple.findById(user.coupleId)
      .populate('user1', 'name email avatar isOnline lastSeen')
      .populate('user2', 'name email avatar isOnline lastSeen');
  }

  res.json({ user, couple });
});

// GET /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /api/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google` }),
  (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const token = signToken(user._id.toString());
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

// GET /api/auth/spotify
router.get('/spotify', passport.authenticate('spotify'));

// GET /api/auth/spotify/callback
router.get(
  '/spotify/callback',
  passport.authenticate('spotify', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=spotify` }),
  (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const token = signToken(user._id.toString());
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

export default router;
