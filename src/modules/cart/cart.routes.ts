import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { supabase } from '../../core/supabaseClient';

const router = Router();

// Schema validasi untuk menambah item ke keranjang
const addCartItemSchema = z.object({
  product_id: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive(),
});

// Schema validasi untuk update kuantitas item
const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

// GET /api/v1/cart - Mendapatkan isi keranjang belanja pengguna
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Get cart for user:', userId);

    // Ambil keranjang dan semua item-itemnya dengan detail produk
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select(`
        id,
        cart_items (
          id,
          product_id,
          quantity,
          created_at,
          products (
            id,
            title,
            price,
            unit,
            store_id,
            image_urls,
            stores (
              store_name
            )
          )
        )
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (cartError) {
      console.error('Cart error:', cartError);
      throw cartError;
    }

    // Jika keranjang belum ada, buat keranjang baru
    if (!cart) {
      console.log('Creating new cart for user:', userId);
      
      // Ambil atau buat keranjang menggunakan fungsi helper
      const { data: cartId, error: cartFunctionError } = await supabase
        .rpc('create_cart_if_not_exists', { p_user_id: userId });

      if (cartFunctionError) {
        console.error('Cart function error:', cartFunctionError);
        throw cartFunctionError;
      }

      console.log('Cart ID from function:', cartId);
      const cart = { id: cartId };

      return res.status(200).json({
        items: [],
        total_price: 0
      });
    }

    // Hitung total harga
    const totalPrice = cart.cart_items.reduce((total: number, item: any) => {
      return total + (item.products.price * item.quantity);
    }, 0);

    // Format respons sesuai dokumentasi API
    const formattedItems = cart.cart_items.map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      created_at: item.created_at,
      product: {
        id: item.products.id,
        title: item.products.title,
        price: item.products.price,
        unit: item.products.unit,
        store_id: item.products.store_id,
        image_urls: item.products.image_urls,
        store: {
          store_name: item.products.stores.store_name
        }
      }
    }));

    res.status(200).json({
      items: formattedItems,
      total_price: totalPrice
    });

  } catch (error: any) {
    console.error('Get cart error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    // Handle specific Supabase errors
    if (error.code === 'PGRST301') {
      // JWT expired or invalid
      return res.status(401).json({ 
        message: 'Token expired or invalid', 
        error: 'Authentication required' 
      });
    }
    
    if (error.code === 'PGRST116') {
      // No rows returned - cart doesn't exist
      return res.status(200).json({
        items: [],
        total_price: 0
      });
    }
    
    res.status(500).json({ 
      message: 'Gagal mengambil data keranjang', 
      error: error.message,
      code: error.code 
    });
  }
});

// POST /api/v1/cart/items - Menambahkan item ke keranjang
router.post('/items', authMiddleware, async (req, res) => {
  try {
    console.log('Add cart item request body:', req.body);
    console.log('User ID:', req.user.id);
    
    const validation = addCartItemSchema.safeParse(req.body);
    if (!validation.success) {
      console.log('Validation error:', validation.error.flatten());
      return res.status(400).json({ 
        message: 'Data tidak valid',
        errors: validation.error.flatten() 
      });
    }

    const { product_id, quantity } = validation.data;
    const userId = req.user.id;

    // Pastikan produk ada
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, price, stock')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    // Cek stok
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Stok tidak mencukupi' });
    }

    // Ambil atau buat keranjang menggunakan fungsi helper
    const { data: cartId, error: cartFunctionError } = await supabase
      .rpc('create_cart_if_not_exists', { p_user_id: userId });

    if (cartFunctionError) {
      console.error('Cart function error:', cartFunctionError);
      throw cartFunctionError;
    }

    console.log('Cart ID from function:', cartId);
    const cart = { id: cartId };

    // Cek apakah item sudah ada di keranjang
    const { data: existingItem, error: existingError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart!.id)
      .eq('product_id', product_id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    let cartItem;
    if (existingItem) {
      // Update kuantitas jika item sudah ada
      const newQuantity = existingItem.quantity + quantity;
      
      // Cek stok lagi untuk kuantitas baru
      if (product.stock < newQuantity) {
        return res.status(400).json({ message: 'Stok tidak mencukupi' });
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateError) throw updateError;
      cartItem = updatedItem;
    } else {
      // Tambah item baru
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart!.id,
          product_id: product_id,
          quantity: quantity
        })
        .select()
        .single();

      if (insertError) throw insertError;
      cartItem = newItem;
    }

    res.status(201).json({
      message: 'Item berhasil ditambahkan ke keranjang',
      item: cartItem
    });

  } catch (error: any) {
    console.error('Add cart item error:', error);
    res.status(500).json({ 
      message: 'Gagal menambahkan item ke keranjang', 
      error: error.message 
    });
  }
});

// PUT /api/v1/cart/items/:itemId - Mengupdate kuantitas item di keranjang
router.put('/items/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const validation = updateCartItemSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.flatten() });
    }

    const { quantity } = validation.data;

    // Verifikasi bahwa item ini milik user
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        product_id,
        products (
          id,
          title,
          price,
          stock
        ),
        carts (
          user_id
        )
      `)
      .eq('id', itemId)
      .single();

    if (itemError || !cartItem) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }

    if ((cartItem.carts as any).user_id !== userId) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    // Cek stok
    if ((cartItem.products as any).stock < quantity) {
      return res.status(400).json({ message: 'Stok tidak mencukupi' });
    }

    // Update kuantitas
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({
      message: 'Kuantitas item berhasil diupdate',
      item: updatedItem
    });

  } catch (error: any) {
    console.error('Update cart item error:', error);
    res.status(500).json({ 
      message: 'Gagal mengupdate kuantitas item', 
      error: error.message 
    });
  }
});

// DELETE /api/v1/cart/items/:itemId - Menghapus item dari keranjang
router.delete('/items/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    // Verifikasi bahwa item ini milik user
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .select(`
        id,
        carts (
          user_id
        )
      `)
      .eq('id', itemId)
      .single();

    if (itemError || !cartItem) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }

    if ((cartItem.carts as any).user_id !== userId) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    // Hapus item
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) throw deleteError;

    res.status(200).json({
      message: 'Item berhasil dihapus dari keranjang'
    });

  } catch (error: any) {
    console.error('Delete cart item error:', error);
    res.status(500).json({ 
      message: 'Gagal menghapus item dari keranjang', 
      error: error.message 
    });
  }
});

export default router;
