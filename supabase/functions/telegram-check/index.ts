import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) throw new Error('TELEGRAM_API_KEY is not configured');

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const body = req.method === 'POST' ? await req.json() : {};

    switch (action) {
      // Check if user is subscribed to a channel
      case 'check_subscription': {
        const { chat_id, user_telegram_id } = body;
        if (!chat_id || !user_telegram_id) {
          return error('chat_id and user_telegram_id required', 400);
        }

        const response = await fetch(`${GATEWAY_URL}/getChatMember`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': TELEGRAM_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chat_id,
            user_id: user_telegram_id,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          // User might not be in the channel
          return ok({ subscribed: false, status: 'not_found' });
        }

        const status = data.result?.status;
        const isSubscribed = ['member', 'administrator', 'creator'].includes(status);

        return ok({ subscribed: isSubscribed, status });
      }

      // Check mandatory channel subscription (Star_Dragonn)
      case 'check_mandatory_sub': {
        const { user_telegram_id } = body;
        if (!user_telegram_id) return error('user_telegram_id required', 400);

        // Check @Star_Dragonn channel
        const response = await fetch(`${GATEWAY_URL}/getChatMember`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': TELEGRAM_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: '@Star_Dragonn',
            user_id: user_telegram_id,
          }),
        });

        const data = await response.json();
        const status = data.result?.status;
        const isSubscribed = ['member', 'administrator', 'creator'].includes(status || '');

        return ok({ subscribed: isSubscribed, status: status || 'not_found' });
      }

      default:
        return error('Unknown action', 400);
    }
  } catch (e: any) {
    return error(e.message || 'Internal error', 500);
  }
});

function ok(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function error(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
