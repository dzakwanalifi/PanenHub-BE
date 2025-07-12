import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { supabase } from '../../core/supabaseClient';

const router = Router();

// Skema validasi untuk membuat toko baru
const createStoreSchema = z.object({
  store_name: z.string().min(3, "Nama toko minimal 3 karakter"),
  description: z.string().optional(),
});

// Endpoint untuk membuat toko baru (Dilindungi)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const validation = createStoreSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.flatten() });
    }

    const { store_name, description } = validation.data;
    const userId = req.user.id;

    // Coba gunakan RPC function dulu
    try {
      const { data, error } = await supabase.rpc('create_store_and_set_seller', {
        user_id: userId,
        store_name: store_name,
        store_description: description
      });

      if (error) throw error;
      res.status(201).json(data);
    } catch (rpcError: any) {
      // Fallback: Jika RPC function tidak ada, gunakan manual transaction
      console.warn('RPC function not available, using manual transaction:', rpcError.message);
      
      // Manual transaction
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .insert({
          owner_id: userId,
          store_name: store_name,
          description: description
        })
        .select()
        .single();

      if (storeError) throw storeError;

      // Update profile to seller
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_seller: true })
        .eq('id', userId);

      if (profileError) {
        console.warn('Failed to update profile to seller:', profileError.message);
      }

      res.status(201).json(storeData);
    }

  } catch (error: any) {
    console.error('Store creation error:', error);
    res.status(500).json({ message: 'Gagal membuat toko', error: error.message });
  }
});

// Endpoint untuk update toko (Dilindungi)
router.put('/update/:storeId', authMiddleware, async (req, res) => {
  try {
    const { storeId } = req.params;
    const userId = req.user.id;
    const validation = createStoreSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.flatten() });
    }

    const { store_name, description } = validation.data;

    // Verifikasi ownership
    const { data: store, error: checkError } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();

    if (checkError || !store) {
      return res.status(404).json({ message: 'Toko tidak ditemukan' });
    }

    if (store.owner_id !== userId) {
      return res.status(403).json({ message: 'Tidak memiliki akses untuk mengupdate toko ini' });
    }

    // Update toko
    const { data: updatedStore, error: updateError } = await supabase
      .from('stores')
      .update({
        store_name: store_name,
        description: description
      })
      .eq('id', storeId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json(updatedStore);
  } catch (error: any) {
    console.error('Store update error:', error);
    res.status(500).json({ message: 'Gagal mengupdate toko', error: error.message });
  }
});

// Endpoint untuk mendapatkan semua toko (Publik)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Get stores error:', error);
    res.status(500).json({ message: 'Gagal mengambil data toko', error: error.message });
  }
});

// Endpoint untuk mendapatkan detail toko (Publik)
router.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Toko tidak ditemukan' });
    }

    res.status(200).json(data);
  } catch (error: any) {
    console.error('Get store detail error:', error);
    res.status(500).json({ message: 'Gagal mengambil detail toko', error: error.message });
  }
});

export default router; 