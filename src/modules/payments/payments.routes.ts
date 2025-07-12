import { Router } from 'express';
import { validateTripayWebhook, createTripayTransaction } from './payments.service';
import { supabase } from '../../core/supabaseClient';

const router = Router();

router.post('/webhook', async (req, res) => {
    const signature = (req.headers['x-callback-signature'] || req.headers['X-Callback-Signature']) as string;



    const validation = validateTripayWebhook(req.body, signature);
    
    if (!validation.valid) {
        return res.status(401).json({ 
            success: false, 
            message: validation.error || 'Invalid Signature' 
        });
    }
    
    const { merchant_ref, status } = req.body;

    try {
        if (status === 'PAID') {
            // Log pembayaran berhasil - sementara tanpa RPC
            console.log(`Payment successful for merchant_ref: ${merchant_ref}`);
            console.log('Payment data:', req.body);
            
            // TODO: Implementasi update database setelah SQL functions siap
            // const { error } = await supabase.rpc('handle_successful_payment', {
            //     p_checkout_session_id: merchant_ref
            // });
            // if (error) throw error;
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Webhook received successfully',
            merchant_ref: merchant_ref,
            status: status
        });
    } catch (error: any) {
        console.error('Webhook error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error',
            error: error.message
        });
    }
});

// Test endpoint untuk membuat transaksi TriPay
router.post('/create-transaction', async (req, res) => {
    try {
        const transactionData = {
            merchant_ref: `TEST-${Date.now()}`,
            amount: 50000,
            customer_name: 'Test Customer',
            customer_email: 'test@example.com',
            order_items: [
                {
                    sku: 'PROD-001',
                    name: 'Produk Test',
                    price: 50000,
                    quantity: 1
                }
            ],
            method: 'QRISC' // QRIS Customer
        };

        const result = await createTripayTransaction(transactionData);
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router; 