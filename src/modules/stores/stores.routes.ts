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

    // Gunakan RPC untuk transaksi agar atomik
    const { data, error } = await supabase.rpc('create_store_and_set_seller', {
        user_id: userId,
        store_name: store_name,
        store_description: description
    });

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal membuat toko', error: error.message });
  }
});

// Endpoint untuk mengupdate toko (Dilindungi)
router.put('/update/:storeId', authMiddleware, async (req, res) => {
    // ... Implementasi logika update toko di sini ...
    // Pastikan untuk memverifikasi bahwa req.user.id adalah pemilik toko
    res.status(501).json({ message: 'Not Implemented' });
});

export default router; 