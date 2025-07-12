import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { supabase } from '../../core/supabaseClient';
import { createTripayTransaction } from '../payments/payments.service';
import { sendNotificationToUser } from '../notifications/notifications.service';

const router = Router();

// Schema validasi untuk update status pesanan
const updateStatusSchema = z.object({
  status: z.enum(['processing', 'shipped', 'delivered', 'cancelled'], {
    errorMap: () => ({ message: 'Status harus salah satu dari: processing, shipped, delivered, cancelled' })
  })
});

router.post('/create_from_cart', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Ambil keranjang & item-itemnya
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id, cart_items(*, products(*))') // Ambil data produk
      .eq('user_id', userId)
      .single();

    if (cartError || !cart || cart.cart_items.length === 0) {
      return res.status(400).json({ message: 'Keranjang kosong atau tidak ditemukan.' });
    }

    // 2. Panggil fungsi RPC untuk membuat pesanan dan sesi checkout
    const { data: session, error: rpcError } = await supabase.rpc('create_orders_from_cart', {
        p_user_id: userId,
        p_cart_id: cart.id
    }).single();

    if (rpcError) throw rpcError;

    // 3. Panggil modul pembayaran untuk membuat link pembayaran
    const paymentData = await createTripayTransaction({
        merchant_ref: (session as any).checkout_session_id,
        amount: (session as any).total_amount,
        customer_name: req.user.email,
        customer_email: req.user.email,
        order_items: cart.cart_items.map(i => ({
            sku: i.products.id,
            name: i.products.title,
            price: i.products.price,
            quantity: i.quantity,
        })),
        method: req.body.payment_method || 'QRIS',
    });

    res.status(201).json({
        message: 'Pesanan berhasil dibuat',
        payment_details: paymentData,
    });

  } catch (error: any) {
    res.status(500).json({ message: 'Gagal membuat pesanan', error: error.message });
  }
});

// Endpoint untuk mengupdate status pesanan oleh penjual
router.put('/:orderId/status', authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.params;
        const sellerId = req.user.id;
        
        // 1. Validasi input
        const validation = updateStatusSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ 
                message: 'Input tidak valid', 
                errors: validation.error.errors 
            });
        }
        
        const { status } = validation.data;
        
        // 2. Verifikasi bahwa pesanan ini milik toko penjual
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                stores!inner(owner_id)
            `)
            .eq('id', orderId)
            .eq('stores.owner_id', sellerId)
            .single();
            
        if (orderError || !order) {
            return res.status(404).json({ 
                message: 'Pesanan tidak ditemukan atau Anda tidak memiliki akses' 
            });
        }
        
        // 3. Update Status Pesanan di Database
        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({ shipping_status: status })
            .eq('id', orderId)
            .select()
            .single();

        if (updateError) throw updateError;
        
        // =================================================================
        // IMPLEMENTASI NOTIFIKASI UNTUK PEMBELI
        // =================================================================
        
        // 4. Kirim Notifikasi ke Pembeli
        if (order.buyer_id) {
            const notificationTitle = `Status Pesanan Diperbarui`;
            let notificationBody = '';
            
            // Buat pesan yang sesuai dengan status
            switch (status) {
                case 'processing':
                    notificationBody = 'Pesanan Anda sedang diproses oleh penjual.';
                    break;
                case 'shipped':
                    notificationBody = 'Pesanan Anda telah dikirim oleh penjual. Klik untuk melihat detail.';
                    break;
                case 'delivered':
                    notificationBody = 'Pesanan Anda telah berhasil diterima. Terima kasih!';
                    break;
                case 'cancelled':
                    notificationBody = 'Pesanan Anda telah dibatalkan oleh penjual.';
                    break;
                default:
                    notificationBody = 'Status pesanan Anda telah diperbarui.';
            }
            
            await sendNotificationToUser(order.buyer_id, {
                title: notificationTitle,
                body: notificationBody,
                data: { 
                    // URL ini akan dibuka saat pengguna mengklik notifikasi
                    url: `/transaksi/${orderId}`
                }
            });
        }
        
        // =================================================================
        // AKHIR IMPLEMENTASI NOTIFIKASI
        // =================================================================

        res.status(200).json({
            message: 'Status pesanan berhasil diperbarui',
            order: updatedOrder
        });

    } catch (error: any) {
        console.error('Order status update error:', error);
        res.status(500).json({ 
            message: 'Gagal mengupdate status pesanan', 
            error: error.message 
        });
    }
});

export default router; 