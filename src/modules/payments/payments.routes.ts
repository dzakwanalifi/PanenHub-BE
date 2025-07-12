import { Router } from 'express';
import { validateTripayWebhook, createTripayTransaction } from './payments.service';
import { supabase } from '../../core/supabaseClient';
// import { sendNotificationToUsers } from '../notifications/notifications.service';

const router = Router();

interface OrderWithStore {
    stores: {
        owner_id: string;
    }[];
}

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
            // Update database terlebih dahulu untuk memastikan konsistensi
            const { error: rpcError } = await supabase.rpc('handle_successful_payment', {
                p_checkout_session_id: merchant_ref
            });

            // Jika update database gagal, hentikan proses dan catat error
            if (rpcError) {
                console.error('Error calling handle_successful_payment RPC:', rpcError);
                // Penting untuk tidak melempar error ke TriPay agar tidak terjadi pengiriman ulang
                // Cukup kirim response error ke log monitoring Anda
                return res.status(500).json({ success: false, message: 'Failed to process successful payment in DB' });
            }

            // Get all seller IDs from orders that were just paid
            const { data: orders, error: orderError } = await supabase
                .from('orders')
                .select('stores(owner_id)')
                .eq('checkout_session_id', merchant_ref);

            if (orderError) throw orderError;

            // Get unique seller IDs
            const sellerIds = [...new Set((orders as OrderWithStore[] || []).flatMap(o => o.stores.map(s => s.owner_id)))];

            // Send notification to each seller
            // if (sellerIds.length > 0) {
            //     await sendNotificationToUsers(sellerIds, {
            //         title: 'Pesanan Baru Diterima! 🎉',
            //         body: 'Anda baru saja menerima pesanan baru. Segera periksa dashboard Anda!',
            //         data: { url: '/dashboard/orders' }
            //     });
            // }
        } else if (status === 'FAILED' || status === 'EXPIRED') {
            // Panggil RPC untuk menangani pembayaran yang gagal atau kedaluwarsa
            const { error: rpcError } = await supabase.rpc('handle_failed_payment', {
                p_checkout_session_id: merchant_ref
            });

            if (rpcError) {
                console.error('Error calling handle_failed_payment RPC:', rpcError);
                return res.status(500).json({ success: false, message: 'Failed to process failed payment in DB' });
            }
            
            // Anda bisa menambahkan notifikasi kepada pengguna bahwa pembayaran mereka gagal
            console.log(`Payment ${status.toLowerCase()} for checkout session: ${merchant_ref}`);
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