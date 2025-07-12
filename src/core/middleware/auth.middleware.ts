import { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabaseClient';

// Menambahkan properti 'user' ke tipe Request Express
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({ message: `Unauthorized: ${error.message}` });
    }
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    // Lampirkan data pengguna ke request untuk digunakan oleh endpoint selanjutnya
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 