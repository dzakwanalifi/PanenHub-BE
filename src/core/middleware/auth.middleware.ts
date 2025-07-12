import { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabaseClient';

// Tambahkan properti 'user' ke tipe Request Express
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('JWT validation error:', error.message);
      res.status(401).json({ message: `Unauthorized: ${error.message}` });
      return;
    }

    if (!user) {
      res.status(401).json({ message: 'Unauthorized: Invalid token' });
      return;
    }

    // Lampirkan data pengguna ke request untuk digunakan oleh endpoint selanjutnya
    req.user = user;
    next();
  } catch (err) {
    console.error('Unexpected error in auth middleware:', err);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
}; 