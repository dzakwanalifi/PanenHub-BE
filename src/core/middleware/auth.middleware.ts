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
    // Use Supabase's built-in getUser method to validate the token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Supabase auth error:', error?.message);
      return res.status(401).json({ message: `Unauthorized: ${error?.message || 'Invalid token'}` });
    }

    // Attach the user information to the request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || 'authenticated'
    };

    next();
  } catch (err) {
    const error = err as Error;
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: `Unauthorized: ${error.message}` });
  }
}; 