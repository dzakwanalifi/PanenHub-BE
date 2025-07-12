import { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../../core/supabaseClient';
import { createTripayTransaction } from '../payments/payments.service';
// import { sendNotificationToUser } from '../notifications/notifications.service';

// Validation schemas
const createCampaignSchema = z.object({
    product_id: z.string().uuid(),
    store_id: z.string().uuid(),
    group_price: z.number().positive(),
    target_quantity: z.number().int().positive(),
    end_date: z.string().datetime(),
});

const joinCampaignSchema = z.object({
    quantity: z.number().int().positive(),
    payment_method: z.string().optional(),
});

// Service functions
export const createCampaign = async (req: Request, res: Response) => {
    try {
        const validation = createCampaignSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.flatten() });
        }

        const campaignData = validation.data;
        const userId = req.user.id;

        // Verify store ownership
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('owner_id')
            .eq('id', campaignData.store_id)
            .single();

        if (storeError || !store || store.owner_id !== userId) {
            return res.status(403).json({ message: 'Unauthorized: Not the store owner' });
        }

        // Create campaign
        const { data: campaign, error: campaignError } = await supabase
            .from('group_buy_campaigns')
            .insert({
                ...campaignData,
                current_quantity: 0,
                status: 'active'
            })
            .select()
            .single();

        if (campaignError) throw campaignError;

        res.status(201).json({
            message: 'Campaign created successfully',
            campaign
        });

    } catch (error: any) {
        res.status(500).json({ message: 'Failed to create campaign', error: error.message });
    }
};

export const getAllCampaigns = async (req: Request, res: Response) => {
    try {
        const { data: campaigns, error } = await supabase
            .from('group_buy_campaigns')
            .select(`
                *,
                product:products(*),
                store:stores(id, store_name, banner_url)
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(campaigns);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch campaigns', error: error.message });
    }
};

export const getCampaignById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: campaign, error: campaignError } = await supabase
            .from('group_buy_campaigns')
            .select(`
                *,
                product:products(*),
                store:stores(id, store_name, banner_url),
                participants:group_buy_participants(
                    id,
                    quantity,
                    payment_status,
                    created_at
                )
            `)
            .eq('id', id)
            .single();

        if (campaignError || !campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        res.json(campaign);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch campaign details', error: error.message });
    }
};

export const updateCampaign = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const validation = createCampaignSchema.partial().safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.flatten() });
        }

        // Verify store ownership and campaign existence
        const { data: campaign, error: checkError } = await supabase
            .from('group_buy_campaigns')
            .select('store_id')
            .eq('id', id)
            .single();

        if (checkError || !campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('owner_id')
            .eq('id', campaign.store_id)
            .single();

        if (storeError || !store || store.owner_id !== userId) {
            return res.status(403).json({ message: 'Unauthorized: Not the store owner' });
        }

        // Update campaign
        const { data: updatedCampaign, error: updateError } = await supabase
            .from('group_buy_campaigns')
            .update(validation.data)
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        res.json({
            message: 'Campaign updated successfully',
            campaign: updatedCampaign
        });

    } catch (error: any) {
        res.status(500).json({ message: 'Failed to update campaign', error: error.message });
    }
};

export const deleteCampaign = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify store ownership and campaign existence
        const { data: campaign, error: checkError } = await supabase
            .from('group_buy_campaigns')
            .select('store_id')
            .eq('id', id)
            .single();

        if (checkError || !campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('owner_id')
            .eq('id', campaign.store_id)
            .single();

        if (storeError || !store || store.owner_id !== userId) {
            return res.status(403).json({ message: 'Unauthorized: Not the store owner' });
        }

        // Delete campaign
        const { error: deleteError } = await supabase
            .from('group_buy_campaigns')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        res.status(200).json({ message: 'Campaign deleted successfully' });

    } catch (error: any) {
        res.status(500).json({ message: 'Failed to delete campaign', error: error.message });
    }
};


export const joinCampaign = async (req: Request, res: Response) => {
    try {
        const { id: campaignId } = req.params;
        const userId = req.user.id;
        
        const validation = joinCampaignSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.flatten() });
        }
        const { quantity, payment_method = 'QRIS' } = validation.data;

        // Get campaign details
        const { data: campaign, error: campaignError } = await supabase
            .from('group_buy_campaigns')
            .select('id, group_price, status, target_quantity, current_quantity')
            .eq('id', campaignId)
            .single();

        if (campaignError || !campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        if (campaign.status !== 'active') {
            return res.status(400).json({ message: 'Campaign is no longer active' });
        }

        if (campaign.current_quantity + quantity > campaign.target_quantity) {
            return res.status(400).json({ message: 'Requested quantity exceeds remaining slots' });
        }

        const totalPrice = campaign.group_price * quantity;

        // Create participation record
        const { data: participant, error: participantError } = await supabase
            .from('group_buy_participants')
            .insert({
                campaign_id: campaignId,
                user_id: userId,
                quantity,
                total_price: totalPrice,
                payment_status: 'pending'
            })
            .select()
            .single();

        if (participantError) {
            if (participantError.code === '23505') {
                return res.status(409).json({ message: 'You have already joined this campaign' });
            }
            throw participantError;
        }

        // Create TriPay transaction
        const paymentDetails = await createTripayTransaction({
            merchant_ref: `GB-${participant.id}`,
            amount: totalPrice,
            customer_name: req.user.email,
            customer_email: req.user.email,
            order_items: [{
                name: 'Group Buy Participation',
                price: totalPrice,
                quantity: 1,
                sku: `GB-${campaignId}`
            }],
            method: payment_method
        });

        // Update TriPay reference
        await supabase
            .from('group_buy_participants')
            .update({ tripay_reference: paymentDetails.reference })
            .eq('id', participant.id);

        // Send notification to user
        // await sendNotificationToUser(userId, {
        //     title: 'Berhasil Bergabung Patungan',
        //     body: 'Silakan selesaikan pembayaran untuk mengikuti patungan',
        //     data: {
        //         url: `/group-buy/${campaignId}`
        //     }
        // });

        res.status(201).json({
            message: 'Successfully joined the campaign',
            payment_details: paymentDetails
        });

    } catch (error: any) {
        res.status(500).json({ message: 'Failed to join campaign', error: error.message });
    }
}; 