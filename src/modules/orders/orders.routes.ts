import { Router } from 'express';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { supabase } from '../../core/supabaseClient';
import { createTripayTransaction } from '../payments/payments.service';

const router = Router();

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

export default router; 