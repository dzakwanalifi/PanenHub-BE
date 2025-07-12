import { Router } from 'express';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { createCampaign, deleteCampaign, getAllCampaigns, getCampaignById, joinCampaign, updateCampaign } from './groupbuy.service';

const router = Router();

// Public endpoints
router.get('/', getAllCampaigns);
router.get('/:id', getCampaignById);

// Protected endpoints
router.post('/', authMiddleware, createCampaign);
router.put('/:id', authMiddleware, updateCampaign);
router.delete('/:id', authMiddleware, deleteCampaign);
router.post('/:id/join', authMiddleware, joinCampaign);

export default router; 