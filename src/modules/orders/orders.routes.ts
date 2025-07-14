import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { supabase } from '../../core/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { createTripayTransaction } from '../payments/payments.service';
// import { sendNotificationToUser } from '../notifications/notifications.service';

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
    console.log('Creating order for user:', userId);
    
    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing required environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    // 1. Ambil keranjang & item-itemnya dengan data produk dan store
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select(`
        id, 
        cart_items(
          *, 
          products(*, store_id)
        )
      `)
      .eq('user_id', userId)
      .single();

    console.log('Cart query result:', { cart, cartError });

    if (cartError) {
      console.error('Cart query error:', cartError);
      return res.status(400).json({ 
        message: 'Gagal mengambil data keranjang', 
        error: cartError.message 
      });
    }

    if (!cart || !cart.cart_items || cart.cart_items.length === 0) {
      return res.status(400).json({ message: 'Keranjang kosong atau tidak ditemukan.' });
    }

    console.log('Cart items:', cart.cart_items);

    // 2. Group cart items by store
    const itemsByStore: Record<string, any[]> = {};
    
    for (const item of cart.cart_items) {
      console.log('Processing cart item:', item);
      
      if (!item.products) {
        console.error('Missing product data in cart item:', item);
        return res.status(400).json({ 
          message: 'Data produk tidak lengkap di keranjang'
        });
      }
      
      const storeId = item.products.store_id;
      if (!storeId) {
        console.error('Missing store_id in cart item:', item);
        return res.status(400).json({ 
          message: 'Informasi toko tidak ditemukan pada produk di keranjang'
        });
      }
      
      if (!itemsByStore[storeId]) {
        itemsByStore[storeId] = [];
      }
      itemsByStore[storeId].push(item);
    }

    console.log('Items grouped by store:', itemsByStore);

    // 3. Calculate total amount
    let totalAmount = 0;
    for (const item of cart.cart_items) {
      const price = item.products?.price;
      const quantity = item.quantity;
      
      if (!price || !quantity) {
        console.error('Missing price or quantity in cart item:', item);
        return res.status(400).json({ 
          message: 'Data harga atau jumlah produk tidak lengkap'
        });
      }
      
      totalAmount += (price * quantity);
    }

    console.log('Total amount calculated:', totalAmount);

    if (totalAmount <= 0) {
      return res.status(400).json({ 
        message: 'Total pesanan tidak valid'
      });
    }

    // 4. Use service role client to bypass RLS for checkout session creation
    const serviceSupabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: checkoutSession, error: sessionError } = await serviceSupabase
      .from('checkout_sessions')
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Checkout session creation error:', sessionError);
      return res.status(500).json({ 
        message: 'Gagal membuat sesi checkout', 
        error: sessionError.message 
      });
    }

    console.log('Checkout session created:', checkoutSession);

    // 5. Create separate orders for each store
    const createdOrders = [];
    
    for (const [storeId, storeItems] of Object.entries(itemsByStore)) {
      const storeTotal = (storeItems as any[]).reduce((sum: number, item: any) => {
        return sum + (item.products.price * item.quantity);
      }, 0);

      console.log(`Creating order for store ${storeId} with total: ${storeTotal}`);

      // Create order for this store using service role client to bypass RLS
      const { data: newOrder, error: orderError } = await serviceSupabase
        .from('orders')
        .insert({
          checkout_session_id: checkoutSession.id,
          buyer_id: userId,
          store_id: storeId,
          total_amount: storeTotal,
          shipping_status: 'processing'
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error for store:', storeId, orderError);
        return res.status(500).json({ 
          message: `Gagal membuat pesanan untuk toko ${storeId}`, 
          error: orderError.message 
        });
      }

      console.log('Order created for store:', newOrder);

      // Create order items for this store using service role client
      const orderItems = (storeItems as any[]).map((item: any) => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.products.price
      }));

      console.log('Creating order items:', orderItems);

      const { error: itemsError } = await serviceSupabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        return res.status(500).json({ 
          message: 'Gagal membuat detail pesanan', 
          error: itemsError.message 
        });
      }

      createdOrders.push(newOrder);
    }

    // 6. Clear cart after successful order creation
    const { error: clearCartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (clearCartError) {
      console.warn('Failed to clear cart:', clearCartError);
      // Don't fail the request if cart clearing fails
    }

    // 7. Return success response with payment details
    const responseData = {
      message: 'Pesanan berhasil dibuat',
      checkout_session_id: checkoutSession.id,
      orders: createdOrders.map(order => ({
        order_id: order.id,
        store_id: order.store_id,
        total_amount: order.total_amount
      })),
      total_amount: totalAmount,
      payment_details: {
        checkout_url: `/api/v1/payments/checkout/${checkoutSession.id}`,
        reference: `CHECKOUT-${checkoutSession.id}`,
        total_amount: totalAmount,
        status: 'pending'
      }
    };

    console.log('Order creation successful:', responseData);
    res.status(201).json(responseData);

  } catch (error: any) {
    console.error('Error creating order:', error);
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
            
            // await sendNotificationToUser(order.buyer_id, {
            //     title: notificationTitle,
            //     body: notificationBody,
            //     data: { 
            //         // URL ini akan dibuka saat pengguna mengklik notifikasi
            //         url: `/transaksi/${orderId}`
            //     }
            // });
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