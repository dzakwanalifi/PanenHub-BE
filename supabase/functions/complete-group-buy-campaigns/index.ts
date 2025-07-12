import { createClient } from '@supabase/supabase-js';
import { Database } from '../_shared/database.types';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

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

        // Send notification to participant
        await fetch(`${supabaseUrl}/rest/v1/rpc/send_notification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                user_id: participant.user_id,
                title: 'Patungan Berhasil!',
                body: 'Patungan telah mencapai target. Pesanan Anda akan segera diproses.',
                data: {
                    type: 'group_buy_success',
                    campaign_id: campaignId,
                    order_id: order.id
                }
            })
        });
    }
}

async function handleFailedCampaign(campaignId: string) {
    // Update campaign status
    await supabase
        .from('group_buy_campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);

    // Get all paid participants
    const { data: participants } = await supabase
        .from('group_buy_participants')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('payment_status', 'paid');

    if (!participants) return;

    for (const participant of participants) {
        // Update participant status to refunded
        await supabase
            .from('group_buy_participants')
            .update({ payment_status: 'refunded' })
            .eq('id', participant.id);

        // Send notification about refund
        await fetch(`${supabaseUrl}/rest/v1/rpc/send_notification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                user_id: participant.user_id,
                title: 'Patungan Gagal',
                body: 'Patungan tidak mencapai target. Dana Anda akan segera dikembalikan.',
                data: {
                    type: 'group_buy_failed',
                    campaign_id: campaignId
                }
            })
        });
    }
}

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