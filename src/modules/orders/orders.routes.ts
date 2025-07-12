import { Router } from 'express';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { supabase } from '../../core/supabaseClient';
import { createTripayTransaction } from '../payments/payments.service';

const router = Router();

router.post('/create_from_cart', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Ambil keranjang dan item-itemnya
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id, cart_items(*, products(*, stores(id, store_name)))')
      .eq('user_id', userId)
      .single();

    if (cartError || !cart || cart.cart_items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty or not found.' });
    }

    // 2. Kelompokkan item per toko dan hitung total
    let grandTotal = 0;
    const ordersByStore: { [storeId: string]: any } = {};

    for (const item of cart.cart_items) {
      const storeId = item.products.stores.id;
      const itemTotal = item.products.price * item.quantity;
      grandTotal += itemTotal;

      if (!ordersByStore[storeId]) {
        ordersByStore[storeId] = {
          store_id: storeId,
          total_amount: 0,
          items: [],
        };
      }
      ordersByStore[storeId].total_amount += itemTotal;
      ordersByStore[storeId].items.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_purchase: item.products.price,
      });
    }

    // 3. Buat satu sesi checkout
    const { data: session, error: sessionError } = await supabase
      .from('checkout_sessions')
      .insert({ user_id: userId, total_amount: grandTotal })
      .select()
      .single();
    
    if (sessionError) throw sessionError;

    // 4. Buat pesanan untuk setiap toko
    for (const storeId in ordersByStore) {
        const orderData = ordersByStore[storeId];
        const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert({
                checkout_session_id: session.id,
                buyer_id: userId,
                store_id: orderData.store_id,
                total_amount: orderData.total_amount,
            })
            .select()
            .single();

        if (orderError) throw orderError;
        
        // 5. Masukkan item-item pesanan
        const orderItemsToInsert = orderData.items.map((item: any) => ({
            ...item,
            order_id: newOrder.id,
        }));
        const { error: orderItemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
        if (orderItemsError) throw orderItemsError;
    }

    // 6. Panggil modul pembayaran untuk membuat link pembayaran
    const paymentData = await createTripayTransaction({
        merchant_ref: session.id, // Gunakan ID sesi checkout sebagai referensi
        amount: grandTotal,
        customer_name: req.user.email, // Ganti dengan nama jika ada
        customer_email: req.user.email,
        order_items: cart.cart_items.map((i: any) => ({
            sku: i.product_id,
            name: i.products.title,
            price: i.products.price,
            quantity: i.quantity,
        })),
        method: req.body.payment_method || 'QRIS', // Ambil metode pembayaran dari request body
    });

    // 7. Kosongkan keranjang pengguna
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);

    // 8. Kirim URL pembayaran ke frontend
    res.status(201).json({
        message: 'Order created successfully',
        checkout_session_id: session.id,
        payment_details: paymentData,
    });

  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

export default router; 