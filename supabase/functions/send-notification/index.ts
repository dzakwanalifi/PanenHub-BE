/// <reference path="../_shared/deno.d.ts" />

// @ts-ignore - Deno is available in Deno runtime
Deno.serve(async (req) => {
  try {
    const { userId, payload } = await req.json();
    
    if (!userId || !payload) {
      return new Response('userId and payload are required', { status: 400 });
    }
    
    // URL ke backend utama. Gunakan environment variable.
    // @ts-ignore - Deno is available in Deno runtime
    const backendUrl = Deno.env.get('BACKEND_URL') || 'http://localhost:3000'; 
    // @ts-ignore - Deno is available in Deno runtime
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!serviceKey) {
      return new Response('Service key not configured', { status: 500 });
    }

    // Panggil endpoint internal di backend utama
    const response = await fetch(`${backendUrl}/api/v1/notifications/send-internal`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Gunakan service key untuk otentikasi antar service
            'Authorization': `Bearer ${serviceKey}` 
        },
        body: JSON.stringify({ userId, payload })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend responded with ${response.status}: ${errorText}`);
    }

    return new Response('Notification triggered successfully', { status: 200 });
  } catch (error: any) {
    console.error('Error in send-notification function:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}); 