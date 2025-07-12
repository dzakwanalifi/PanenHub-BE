import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { supabase } from '../../core/supabaseClient';

const router = Router();

// Endpoint untuk mendapatkan semua produk (Publik)
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch products", error: error.message });
    }
});

// Endpoint untuk mendapatkan detail produk (Publik)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error || !data) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch product", error: error.message });
    }
});

// Skema validasi produk
const productSchema = z.object({
    store_id: z.string().uuid(),
    title: z.string().min(3),
    description: z.string().optional(),
    price: z.number().positive(),
    unit: z.string().optional(),
    stock: z.number().int().min(0),
});

// Endpoint untuk membuat produk baru (Dilindungi)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const validation = productSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.errors });
        }

        const { store_id } = validation.data;
        const userId = req.user.id;

        // Verifikasi bahwa pengguna adalah pemilik toko
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('owner_id')
            .eq('id', store_id)
            .single();
        
        if (storeError || !store) return res.status(404).json({ message: 'Store not found' });
        if (store.owner_id !== userId) return res.status(403).json({ message: 'Forbidden' });

        const { data: newProduct, error: insertError } = await supabase
            .from('products')
            .insert(validation.data)
            .select()
            .single();

        if (insertError) throw insertError;
        
        res.status(201).json(newProduct);

    } catch (error: any) {
        res.status(500).json({ message: "Failed to create product", error: error.message });
    }
});

// Endpoint untuk mengupdate produk (Dilindungi)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Validasi input
        const updateProductSchema = z.object({
            title: z.string().min(3).optional(),
            description: z.string().optional(),
            price: z.number().positive().optional(),
            unit: z.string().optional(),
            stock: z.number().int().min(0).optional(),
        });
        
        const validation = updateProductSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.errors });
        }

        // Verifikasi bahwa pengguna adalah pemilik produk
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('store_id')
            .eq('id', id)
            .single();
        
        if (productError || !product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Cek apakah user adalah owner dari store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('owner_id')
            .eq('id', product.store_id)
            .single();
        
        if (storeError || !store || store.owner_id !== userId) {
            return res.status(403).json({ message: 'Forbidden: You are not the owner of this product' });
        }

        // Update produk
        const { data: updatedProduct, error: updateError } = await supabase
            .from('products')
            .update(validation.data)
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;
        
        res.status(200).json(updatedProduct);

    } catch (error: any) {
        res.status(500).json({ message: "Failed to update product", error: error.message });
    }
});

// Endpoint untuk menghapus produk (Dilindungi)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verifikasi bahwa pengguna adalah pemilik produk
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('store_id')
            .eq('id', id)
            .single();
        
        if (productError || !product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Cek apakah user adalah owner dari store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('owner_id')
            .eq('id', product.store_id)
            .single();
        
        if (storeError || !store || store.owner_id !== userId) {
            return res.status(403).json({ message: 'Forbidden: You are not the owner of this product' });
        }

        // Hapus produk
        const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;
        
        res.status(200).json({ message: 'Product deleted successfully' });

    } catch (error: any) {
        res.status(500).json({ message: "Failed to delete product", error: error.message });
    }
});

export default router; 