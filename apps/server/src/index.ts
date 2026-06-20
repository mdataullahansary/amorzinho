import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import passport from 'passport';
import { connectDB } from './config/db';
import { initSocket } from './socket';
import { configurePassport } from './config/passport';

// Routes
import authRoutes from './routes/auth';
import coupleRoutes from './routes/couple';
import chatRoutes from './routes/chat';
import musicRoutes from './routes/music';
import diaryRoutes from './routes/diary';
import memoriesRoutes from './routes/memories';
import movieRoutes from './routes/movie';
import bucketRoutes from './routes/bucket';
import analyticsRoutes from './routes/analytics';
import notificationsRoutes from './routes/notifications';

// Error handler
import { errorHandler } from './middleware/errorHandler';

const app = express();
const httpServer = createServer(app);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Passport ─────────────────────────────────────────────────────────────────
configurePassport();
app.use(passport.initialize());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/couple', coupleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/movie', movieRoutes);
app.use('/api/bucket', bucketRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
initSocket(httpServer);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 4000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Amorzinho server running on http://localhost:${PORT}`);
  });
});
