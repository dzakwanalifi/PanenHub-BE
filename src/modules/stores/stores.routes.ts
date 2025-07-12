import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { supabase } from '../../core/supabaseClient';

const router = Router();

// Skema validasi untuk membuat toko baru
const createStoreSchema = z.object({
  store_name: z.string().min(3),
  description: z.string().optional(),
});

// Endpoint untuk membuat toko baru
// Dilindungi oleh middleware otentikasi
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const validation = createStoreSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.errors });
    }

    const { store_name, description } = validation.data;
    const userId = req.user.id;

    // 1. Insert ke tabel 'stores'
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .insert({ owner_id: userId, store_name, description })
      .select()
      .single();

    if (storeError) throw storeError;

    // 2. Update profil pengguna menjadi penjual
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_seller: true })
      .eq('id', userId);

    if (profileError) throw profileError;

    res.status(201).json(storeData);
  } catch (error: any) {
    console.error('Error creating store:', error);
    res.status(500).json({ message: 'Failed to create store', error: error.message });
  }
});

// Endpoint untuk mengupdate toko
// Dilindungi oleh middleware otentikasi
router.put('/update/:storeId', authMiddleware, async (req, res) => {
  try {
    const { storeId } = req.params;
    const userId = req.user.id;

    // Validasi input
    const updateSchema = z.object({
      store_name: z.string().min(3).optional(),
      description: z.string().optional(),
    });
    const validation = updateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.errors });
    }

    // Pastikan pengguna adalah pemilik toko
    const { data: store, error: fetchError } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();

    if (fetchError || !store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    if (store.owner_id !== userId) {
      return res.status(403).json({ message: 'Forbidden: You are not the owner of this store' });
    }

    // Update data toko
    const { data: updatedData, error: updateError } = await supabase
      .from('stores')
      .update(validation.data)
      .eq('id', storeId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json(updatedData);
  } catch (error: any) {
    console.error('Error updating store:', error);
    res.status(500).json({ message: 'Failed to update store', error: error.message });
  }
});

export default router; 