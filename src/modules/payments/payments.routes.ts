import { Router } from 'express';
import { validateTripayWebhook } from './payments.service';
import { supabase } from '../../core/supabaseClient';

const router = Router();

router.post('/webhook', async (req, res) => {
    const signature = req.headers['x-callback-signature'] as string;

    if (!validateTripayWebhook(req.body, signature)) {
        return res.status(401).json({ success: false, message: 'Invalid Signature' });
    }
    
    const { merchant_ref, status } = req.body;

    try {
        if (status === 'PAID') {
            // Gunakan RPC untuk transaksi yang aman
            const { error } = await supabase.rpc('handle_successful_payment', {
                p_checkout_session_id: merchant_ref
            });
            if (error) throw error;
        }
        
        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

export default router; 