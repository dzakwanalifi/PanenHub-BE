import { Response, NextFunction } from 'express';
import { supabase } from '../supabaseClient';

/**
 * Middleware Factory untuk memverifikasi kepemilikan toko.
 * @param entity - Nama tabel yang berisi referensi ke 'store_id' (e.g., 'products', 'orders', 'group_buy_campaigns').
 * @param idSource - Lokasi ID entitas di request ('params' atau 'body').
 * @param idKey - Nama field untuk ID entitas (e.g., 'id' atau 'orderId').
 */
export const verifyStoreOwnership = (
    entity: 'products' | 'stores' | 'orders' | 'group_buy_campaigns',
    idSource: 'params' | 'body',
    idKey: string
) => {
    return async (req: any, res: Response, next: NextFunction) => {
        try {
            const entityId = req[idSource][idKey];
            const userId = req.user.id;

            if (!entityId) {
                return res.status(400).json({ message: `Missing ID: ${idKey}` });
            }

            let storeOwnerId: string | undefined;

            if (entity === 'stores') {
                const { data: store, error } = await supabase
                    .from('stores')
                    .select('owner_id')
                    .eq('id', entityId)
                    .single();
                if (error || !store) return res.status(404).json({ message: 'Store not found' });
                storeOwnerId = store.owner_id;
            } else {
                const { data, error } = await supabase
                    .from(entity)
                    .select('stores(owner_id)')
                    .eq('id', entityId)
                    .single();
                
                if (error || !data) return res.status(404).json({ message: 'Entity not found' });
                storeOwnerId = (data as any).stores.owner_id;
            }

            if (storeOwnerId !== userId) {
                return res.status(403).json({ message: 'Forbidden: You are not the owner of this resource.' });
            }

            next();

        } catch (error: any) {
            res.status(500).json({ message: 'Authorization error', error: error.message });
        }
    };
};

/**
 * Middleware untuk memverifikasi kepemilikan toko dari store_id di body request
 */
export const verifyStoreOwnershipFromBody = (storeIdKey: string = 'store_id') => {
    return async (req: any, res: Response, next: NextFunction) => {
        try {
            const storeId = req.body[storeIdKey];
            const userId = req.user.id;

            if (!storeId) {
                return res.status(400).json({ message: `Missing ${storeIdKey} in request body` });
            }

            const { data: store, error } = await supabase
                .from('stores')
                .select('owner_id')
                .eq('id', storeId)
                .single();

            if (error || !store) {
                return res.status(404).json({ message: 'Store not found' });
            }

            if (store.owner_id !== userId) {
                return res.status(403).json({ message: 'Forbidden: Not the store owner' });
            }

            next();

        } catch (error: any) {
            res.status(500).json({ message: 'Authorization error', error: error.message });
        }
    };
}; 