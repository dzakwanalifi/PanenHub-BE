import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { verifyStoreOwnership, verifyStoreOwnershipFromBody } from '../../core/middleware/authorization.middleware';
import { supabase } from '../../core/supabaseClient';

const router = Router();

// Skema validasi untuk query parameters
const productQuerySchema = z.object({
    q: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().positive().optional(),
    storeId: z.string().uuid().optional(),
    sortBy: z.enum(['price_asc', 'price_desc', 'created_at_desc']).optional().default('created_at_desc'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

// Endpoint untuk mendapatkan produk dengan pencarian dan filter (Publik)
router.get('/', async (req, res) => {
    try {
        // 1. Validasi query parameters
        const validation = productQuerySchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.flatten() });
        }
        const { q, minPrice, maxPrice, storeId, sortBy, page, limit } = validation.data;

        // 2. Bangun query Supabase secara dinamis
        let query = supabase
            .from('products')
            .select('*, stores(store_name)');

        // Filter pencarian teks
        if (q) {
            // Gunakan ilike sebagai fallback jika Full-Text Search belum setup
            query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
        }

        // Filter berdasarkan toko
        if (storeId) {
            query = query.eq('store_id', storeId);
        }

        // Filter rentang harga
        if (minPrice !== undefined) {
            query = query.gte('price', minPrice);
        }
        if (maxPrice !== undefined) {
            query = query.lte('price', maxPrice);
        }

        // 3. Terapkan pengurutan (sorting)
        const [sortField, sortOrder] = sortBy.split('_');
        const actualSortField = sortField === 'created' ? 'created_at' : sortField;
        query = query.order(actualSortField, { ascending: sortOrder === 'asc' });

        // 4. Terapkan paginasi
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit - 1;
        query = query.range(startIndex, endIndex);

        // 5. Eksekusi query
        const { data, error } = await query;
        if (error) throw error;

        // Optional: Dapatkan total count untuk paginasi di frontend
        let totalCount = null;
        if (page === 1) {
            // Hanya ambil count pada page pertama untuk efisiensi
            let countQuery = supabase.from('products').select('*', { count: 'exact', head: true });
            
            // Terapkan filter yang sama untuk count
            if (q) {
                countQuery = countQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
            }
            if (storeId) {
                countQuery = countQuery.eq('store_id', storeId);
            }
            if (minPrice !== undefined) {
                countQuery = countQuery.gte('price', minPrice);
            }
            if (maxPrice !== undefined) {
                countQuery = countQuery.lte('price', maxPrice);
            }
            
            const { count } = await countQuery;
            totalCount = count;
        }

        const response: any = {
            data,
            pagination: {
                page,
                limit,
                hasNextPage: data.length === limit,
                ...(totalCount !== null && { totalCount, totalPages: Math.ceil(totalCount / limit) })
            }
        };

        res.status(200).json(response);

    } catch (error: any) {
        res.status(500).json({ message: "Gagal mengambil data produk", error: error.message });
    }
});

// Endpoint untuk mendapatkan detail produk (Publik)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('products').select('*, stores(store_name, owner_id)').eq('id', id).single();
        if (error || !data) return res.status(404).json({ message: 'Produk tidak ditemukan' });
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ message: "Gagal mengambil data produk", error: error.message });
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
router.post('/', 
    authMiddleware, 
    verifyStoreOwnershipFromBody('store_id'),
    async (req, res) => {
        try {
            const validation = productSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ errors: validation.error.errors });
            }

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
    }
);

// Endpoint untuk mengupdate produk (Dilindungi)
router.put('/:id', 
    authMiddleware, 
    verifyStoreOwnership('products', 'params', 'id'),
    async (req, res) => {
        try {
            const { id } = req.params;

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
    }
);

// Endpoint untuk menghapus produk (Dilindungi)
router.delete('/:id', 
    authMiddleware, 
    verifyStoreOwnership('products', 'params', 'id'),
    async (req, res) => {
        try {
            const { id } = req.params;

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
    }
);

export default router; 