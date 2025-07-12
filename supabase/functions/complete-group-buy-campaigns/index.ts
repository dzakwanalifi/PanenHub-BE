/// <reference path="../_shared/deno.d.ts" />
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// @ts-ignore - Deno is available in Deno runtime
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
// @ts-ignore - Deno is available in Deno runtime
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function handleSuccessfulCampaign(campaignId: string) {
    const { data: campaign } = await supabase
        .from('group_buy_campaigns')
        .update({ status: 'successful' })
        .eq('id', campaignId)
        .select('store_id, product_id')
        .single();

    if (!campaign) return;

    // Get all paid participants
    const { data: participants } = await supabase
        .from('group_buy_participants')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('payment_status', 'paid');

    if (!participants) return;

    // Create orders for each participant
    for (const participant of participants) {
        // Create order
        const { data: order } = await supabase
            .from('orders')
            .insert({
                user_id: participant.user_id,
                store_id: campaign.store_id,
                status: 'pending',
                total_amount: participant.total_price,
                payment_status: 'paid',
                payment_reference: participant.tripay_reference
            })
            .select()
            .single();

        if (!order) continue;

        // Create order item
        await supabase
            .from('order_items')
            .insert({
                order_id: order.id,
                product_id: campaign.product_id,
                quantity: participant.quantity,
                price: participant.total_price / participant.quantity
            });

        // Update participant with order reference
        await supabase
            .from('group_buy_participants')
            .update({ order_id: order.id })
            .eq('id', participant.id);

        // Send notification to the participant about the success
        await supabase.functions.invoke('send-notification', {
            body: {
                userId: participant.user_id,
                payload: {
                    title: 'Patungan Berhasil! 🎉',
                    body: 'Patungan telah mencapai target. Pesanan Anda akan segera diproses oleh penjual.',
                    data: {
                        url: `/transaksi/${order.id}` // Sertakan URL ke detail pesanan
                    }
                }
            }
        });
    }
}

async function handleFailedCampaign(campaignId: string) {
    // Update campaign status to 'failed'
    await supabase
        .from('group_buy_campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);

    // Get all paid participants to notify and update
    const { data: participants } = await supabase
        .from('group_buy_participants')
        .select('id, user_id') // Hanya butuh id dan user_id
        .eq('campaign_id', campaignId)
        .eq('payment_status', 'paid');

    if (!participants || participants.length === 0) return;

    // Proses setiap partisipan
    for (const participant of participants) {
        // 1. Update participant payment_status to 'refunded'
        await supabase
            .from('group_buy_participants')
            .update({ payment_status: 'refunded' })
            .eq('id', participant.id);

        // 2. Send notification about the refund
        // Memanggil Edge Function send-notification yang akan kita buat
        await supabase.functions.invoke('send-notification', {
            body: {
                userId: participant.user_id,
                payload: {
                    title: 'Patungan Gagal 🙁',
                    body: 'Patungan tidak mencapai target. Dana Anda akan segera kami proses untuk pengembalian.',
                    data: {
                        url: '/patungan'
                    }
                }
            }
        });
    }
}

// @ts-ignore - Deno is available in Deno runtime
Deno.serve(async (req) => {
    try {
        // Find expired active campaigns
        const { data: expiredCampaigns, error } = await supabase
            .from('group_buy_campaigns')
            .select('id, target_quantity, current_quantity')
            .eq('status', 'active')
            .lt('end_date', new Date().toISOString());

        if (error) throw error;

        if (!expiredCampaigns) {
            return new Response('No expired campaigns found', { status: 200 });
        }

        // Process each expired campaign
        for (const campaign of expiredCampaigns) {
            if (campaign.current_quantity >= campaign.target_quantity) {
                await handleSuccessfulCampaign(campaign.id);
            } else {
                await handleFailedCampaign(campaign.id);
            }
        }

        return new Response('Successfully processed expired campaigns', { status: 200 });
    } catch (error) {
        return new Response(error.message, { status: 500 });
    }
}); 