import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUserDocument } from '../models/User';

declare global {
  namespace Express {
    // Merge passport's User interface with ours
    interface User extends IUserDocument {}
    interface Request {
      user?: User;
    }
  }
}

export type AuthRequest = Request;

export async function protect(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Not authorized. No token.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ message: 'User not found.' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token.' });
  }
}

export function signToken(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}
