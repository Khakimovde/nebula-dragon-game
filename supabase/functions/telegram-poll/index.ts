import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';
const CHANNEL_USERNAME = '@Star_Dragonn';
const WEB_APP_URL = 'https://69c7573277d05.xvest5.ru';
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY')!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let totalProcessed = 0;

  const { data: state } = await supabase
    .from('telegram_bot_state')
    .select('update_offset')
    .eq('id', 1)
    .single();

  let currentOffset = state?.update_offset || 0;

  while (true) {
    const elapsed = Date.now() - startTime;
    const remainingMs = MAX_RUNTIME_MS - elapsed;
    if (remainingMs < MIN_REMAINING_MS) break;

    const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
    if (timeout < 1) break;

    let response;
    try {
      response = await fetch(`${GATEWAY_URL}/getUpdates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TELEGRAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offset: currentOffset,
          timeout,
          allowed_updates: ['message', 'callback_query'],
        }),
      });
    } catch {
      break;
    }

    const data = await response.json();
    if (!response.ok) break;

    const updates = data.result ?? [];
    if (updates.length === 0) continue;

    for (const update of updates) {
      try {
        if (update.message?.text?.startsWith('/start')) {
          await handleStart(update.message, supabase);
        } else if (update.callback_query?.data?.startsWith('check_sub')) {
          await handleCheckSub(update.callback_query, supabase);
        }
        totalProcessed++;
      } catch (e) {
        console.error('Error processing update:', e);
      }
    }

    const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
    await supabase
      .from('telegram_bot_state')
      .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
      .eq('id', 1);
    currentOffset = newOffset;
  }

  return new Response(JSON.stringify({ ok: true, processed: totalProcessed }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

  // === Handler functions ===

  async function handleStart(message: any, supabase: any) {
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text || '';
    const startParam = text.split(' ')[1] || null;

    const isSubscribed = await checkSubscription(userId);

    if (!isSubscribed) {
      await sendMessage(chatId,
        '🐉 <b>Star Dragon</b> ga xush kelibsiz!\n\n📢 Avval rasmiy kanalimizga obuna bo\'ling:',
        {
          inline_keyboard: [
            [{ text: '📢 Kanalga obuna bo\'lish', url: 'https://t.me/Star_Dragonn' }],
            [{ text: '✅ Tekshirish', callback_data: `check_sub${startParam ? ':' + startParam : ''}` }],
          ]
        }
      );
      return;
    }

    // User is subscribed
    if (startParam && startParam.startsWith('REF_')) {
      await processReferral(userId, startParam, message.from, supabase);
    }

    await sendMessage(chatId,
      '🐉 <b>Star Dragon</b> ga xush kelibsiz!\n\n🎮 O\'yinni ochib yulduzlar yig\'ing!',
      {
        inline_keyboard: [
          [{ text: '🎮 O\'yinni ochish', web_app: { url: WEB_APP_URL } }],
          [{ text: '📢 Rasmiy kanal', url: 'https://t.me/Star_Dragonn' }],
        ]
      }
    );
  }

  async function handleCheckSub(callbackQuery: any, supabase: any) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const callbackData = callbackQuery.data || '';
    const startParam = callbackData.includes(':') ? callbackData.split(':')[1] : null;

    await answerCallbackQuery(callbackQuery.id);

    const isSubscribed = await checkSubscription(userId);

    if (!isSubscribed) {
      await sendMessage(chatId,
        '❌ Siz hali kanalga obuna bo\'lmagansiz!\n\nAvval <b>@Star_Dragonn</b> kanaliga obuna bo\'ling, keyin "Tekshirish" tugmasini bosing.',
        {
          inline_keyboard: [
            [{ text: '📢 Kanalga obuna bo\'lish', url: 'https://t.me/Star_Dragonn' }],
            [{ text: '✅ Tekshirish', callback_data: callbackData }],
          ]
        }
      );
      return;
    }

    // Process referral
    if (startParam && startParam.startsWith('REF_')) {
      await processReferral(userId, startParam, callbackQuery.from, supabase);
    }

    await sendMessage(chatId,
      '✅ Obuna tasdiqlandi!\n\n🐉 <b>Star Dragon</b> ga xush kelibsiz!\n🎮 O\'yinni ochib yulduzlar yig\'ing!',
      {
        inline_keyboard: [
          [{ text: '🎮 O\'yinni ochish', web_app: { url: WEB_APP_URL } }],
          [{ text: '📢 Rasmiy kanal', url: 'https://t.me/Star_Dragonn' }],
        ]
      }
    );
  }

  async function processReferral(newUserId: number, referralCode: string, fromUser: any, supabase: any) {
    const { data: referrer } = await supabase
      .from('users')
      .select('id, telegram_id, referrals, stars')
      .eq('referral_code', referralCode)
      .single();

    if (!referrer || referrer.telegram_id === newUserId) return;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', newUserId)
      .single();

    if (existingUser) {
      const { data: existingRef } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', existingUser.id)
        .single();
      if (existingRef) return;
    }

    // Give referrer bonus
    await supabase.from('users').update({
      stars: referrer.stars + 100,
      referrals: referrer.referrals + 1,
    }).eq('id', referrer.id);

    // Notify referrer
    const name = fromUser.first_name || fromUser.username || 'Yangi foydalanuvchi';
    await sendMessage(referrer.telegram_id,
      `🎉 <b>${name}</b> sizning referal havolangiz orqali qo'shildi!\n\n+100 ⭐ yulduz berildi!`
    );
  }

  async function checkSubscription(userId: number): Promise<boolean> {
    try {
      const res = await fetch(`${GATEWAY_URL}/getChatMember`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TELEGRAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat_id: CHANNEL_USERNAME, user_id: userId }),
      });
      const data = await res.json();
      const status = data.result?.status;
      return ['member', 'administrator', 'creator'].includes(status || '');
    } catch {
      return false;
    }
  }

  async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
    const body: any = { chat_id: chatId, text, parse_mode: 'HTML' };
    if (replyMarkup) body.reply_markup = replyMarkup;

    await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async function answerCallbackQuery(callbackQueryId: string) {
    await fetch(`${GATEWAY_URL}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    });
  }
});
