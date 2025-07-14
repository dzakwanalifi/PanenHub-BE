import { Router } from 'express';
import { validateTripayWebhook, createTripayTransaction } from './payments.service';
import { supabase } from '../../core/supabaseClient';
import { authMiddleware } from '../../core/middleware/auth.middleware';

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

// Get checkout history for authenticated user - HARUS SEBELUM :sessionId route
router.get('/checkout/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        console.log('Fetching checkout history for user:', userId);

        // Query sesuai struktur database yang sebenarnya
        const { data: checkoutSessions, error } = await supabase
            .from('checkout_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching checkout history:', error);
            return res.status(500).json({ 
                message: 'Gagal mengambil riwayat checkout', 
                error: error.message 
            });
        }

        console.log('Checkout sessions found:', checkoutSessions?.length || 0);

        // Transform data sesuai dengan interface frontend
        const transformedSessions = (checkoutSessions || []).map(session => ({
            id: session.id,
            checkout_session_id: session.id, // Use id as session id
            payment_status: session.payment_status,
            payment_method: 'QRIS', // Default value
            total_amount: session.total_amount,
            created_at: session.created_at,
            updated_at: session.created_at, // Use created_at as updated_at
            tripay_reference: session.id, // Use id as reference for now
            tripay_payment_url: session.payment_status === 'pending' ? `/payments/checkout/${session.id}` : null, // Will redirect to create payment
            orders: [] // Empty for now since no orders table connection yet
        }));

        res.json(transformedSessions);

    } catch (error: any) {
        console.error('Error in checkout history:', error);
        res.status(500).json({ 
            message: 'Gagal mengambil riwayat checkout', 
            error: error.message 
        });
    }
});

// Checkout endpoint to handle payment checkout
router.get('/checkout/:sessionId', authMiddleware, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        console.log(`Processing checkout for session: ${sessionId}, user: ${userId}`);

        // Get checkout session
        const { data: checkoutSession, error: sessionError } = await supabase
            .from('checkout_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single();

        if (sessionError || !checkoutSession) {
            console.error('Session not found:', sessionError);
            return res.status(404).json({ 
                message: 'Checkout session tidak ditemukan' 
            });
        }

        console.log('Checkout session found:', checkoutSession);

        // If already paid, redirect to success page
        if (checkoutSession.payment_status === 'paid') {
            return res.json({
                message: 'Pembayaran sudah berhasil',
                status: 'paid',
                checkout_session: {
                    ...checkoutSession,
                    tripay_reference: checkoutSession.id,
                    orders: []
                }
            });
        }

        // If payment failed, show appropriate message
        if (checkoutSession.payment_status === 'failed') {
            return res.json({
                message: 'Pembayaran gagal',
                status: 'failed',
                checkout_session: {
                    ...checkoutSession,
                    tripay_reference: checkoutSession.id,
                    orders: []
                }
            });
        }

        // For pending payment, create real TriPay transaction
        if (checkoutSession.payment_status === 'pending') {
            try {
                // Prepare transaction data for TriPay
                const transactionData = {
                    merchant_ref: checkoutSession.id, // Use checkout session ID as merchant reference
                    amount: checkoutSession.total_amount,
                    customer_name: req.user.email || 'Customer',
                    customer_email: req.user.email,
                    order_items: [
                        {
                            sku: 'CHECKOUT-001',
                            name: `Checkout Session ${checkoutSession.id}`,
                            price: checkoutSession.total_amount,
                            quantity: 1
                        }
                    ],
                    method: 'QRISC' // QRIS Customer
                };

                console.log('Creating TriPay transaction:', transactionData);

                const tripayResult = await createTripayTransaction(transactionData);
                
                // Update checkout session with payment reference and URL
                const { error: updateError } = await supabase
                    .from('checkout_sessions')
                    .update({ 
                        // Note: These columns don't exist in current schema, but we'll add them to response
                        // payment_reference: tripayResult.reference,
                        // payment_url: tripayResult.checkout_url 
                    })
                    .eq('id', checkoutSession.id);

                if (updateError) {
                    console.error('Error updating checkout session:', updateError);
                }

                return res.json({
                    message: 'Checkout berhasil dibuat',
                    status: 'pending',
                    checkout_session: {
                        ...checkoutSession,
                        tripay_reference: tripayResult.reference,
                        tripay_payment_url: tripayResult.checkout_url,
                        orders: []
                    },
                    payment: {
                        reference: tripayResult.reference,
                        checkout_url: tripayResult.checkout_url,
                        amount: tripayResult.amount,
                        status: tripayResult.status
                    }
                });

            } catch (paymentError: any) {
                console.error('TriPay transaction creation failed:', paymentError);
                
                // Return error but still show checkout session
                return res.status(500).json({
                    message: 'Gagal membuat transaksi pembayaran',
                    error: paymentError.message,
                    checkout_session: {
                        ...checkoutSession,
                        tripay_reference: checkoutSession.id,
                        orders: []
                    }
                });
            }
        }

        // Default response
        res.json({
            message: 'Checkout session ditemukan',
            status: checkoutSession.payment_status,
            checkout_session: {
                ...checkoutSession,
                tripay_reference: checkoutSession.id,
                orders: []
            }
        });

    } catch (error: any) {
        console.error('Checkout error:', error);
        res.status(500).json({ 
            message: 'Gagal memproses checkout', 
            error: error.message 
        });
    }
});

export default router;