import { Router } from 'express';

const router = Router();

// Placeholder routes - auth is handled by Supabase directly
router.get('/status', (req, res) => {
  res.json({ 
    message: 'Auth module is active. Authentication is handled by Supabase directly.' 
  });
});

export default router; 