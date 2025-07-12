import { Router } from 'express';
import { validateTripayWebhook } from './payments.service';
import { supabase } from '../../core/supabaseClient';

const router = Router();

router.post('/webhook', async (req, res) => {
    const signature = req.headers['x-callback-signature'] as string;

    // 1. Validasi signature webhook
    if (!validateTripayWebhook(req.body, signature)) {
        return res.status(401).json({ success: false, message: 'Invalid Signature' });
    }
    
    const { merchant_ref, status } = req.body;

    if (!merchant_ref) {
        return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    try {
        if (status === 'PAID') {
            // 2. Update status sesi checkout
            await supabase
                .from('checkout_sessions')
                .update({ payment_status: 'paid' })
                .eq('id', merchant_ref);
            
            // 3. Update status semua order terkait
            await supabase
                .from('orders')
                .update({ shipping_status: 'processing' })
                .eq('checkout_session_id', merchant_ref);
            
            // TODO: Kirim notifikasi ke penjual
        }
        
        // Kirim respons sukses ke TriPay
        res.status(200).json({ success: true });

    } catch (error: any) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

export default router; 