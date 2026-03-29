import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const body = req.method === 'POST' ? await req.json() : {};

    switch (action) {
      // ===== USER =====
      case 'get_or_create_user': {
        const { telegram_id, username, first_name, photo_url, referral_code_used } = body;
        if (!telegram_id) return error('telegram_id required', 400);

        // Check existing
        let { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', telegram_id)
          .single();

        if (!user) {
          const ref_code = `REF_${telegram_id}`;
          const { data: newUser, error: insertErr } = await supabase
            .from('users')
            .insert({
              telegram_id,
              username: username || null,
              first_name: first_name || null,
              photo_url: photo_url || null,
              referral_code: ref_code,
            })
            .select()
            .single();

          if (insertErr) return error(insertErr.message, 500);
          user = newUser;

          // Add default skin
          await supabase.from('user_skins').insert({ user_id: user.id, skin_name: 'green' });

          // Process referral
          if (referral_code_used && referral_code_used !== ref_code) {
            const { data: referrer } = await supabase
              .from('users')
              .select('id')
              .eq('referral_code', referral_code_used)
              .single();

            if (referrer) {
              const { error: refErr } = await supabase.from('referrals').insert({
                referrer_id: referrer.id,
                referred_id: user.id,
              });
              if (!refErr) {
                await supabase.from('users').update({
                  stars: (await supabase.from('users').select('stars').eq('id', referrer.id).single()).data!.stars + 100,
                  referrals: (await supabase.from('users').select('referrals').eq('id', referrer.id).single()).data!.referrals + 1,
                }).eq('id', referrer.id);
              }
            }
          }
        } else {
          // Update profile info
          if (username || first_name || photo_url) {
            await supabase.from('users').update({
              ...(username && { username }),
              ...(first_name && { first_name }),
              ...(photo_url && { photo_url }),
            }).eq('id', user.id);
          }
        }

        // Get skins
        const { data: skins } = await supabase.from('user_skins').select('skin_name').eq('user_id', user.id);
        // Get tasks done
        const { data: tasks } = await supabase.from('user_tasks').select('task_id').eq('user_id', user.id);
        // Get daily bonus
        const { data: bonus } = await supabase.from('daily_bonus').select('*').eq('user_id', user.id).single();

        return ok({
          user: {
            ...user,
            skins: skins?.map(s => s.skin_name) || ['green'],
            tasks_done: tasks?.map(t => t.task_id) || [],
          },
          daily_bonus: bonus || { day: 1, last_claimed: null },
        });
      }

      // ===== UPDATE STARS/COINS =====
      case 'update_balance': {
        const { telegram_id, stars_delta, coins_delta } = body;
        if (!telegram_id) return error('telegram_id required', 400);

        const { data: user } = await supabase.from('users').select('id, stars, coins').eq('telegram_id', telegram_id).single();
        if (!user) return error('User not found', 404);

        const updates: any = {};
        if (stars_delta) updates.stars = Math.max(0, user.stars + stars_delta);
        if (coins_delta) updates.coins = Math.max(0, user.coins + coins_delta);

        const { data, error: err } = await supabase.from('users').update(updates).eq('id', user.id).select().single();
        if (err) return error(err.message, 500);
        return ok({ user: data });
      }

      // ===== LOSE LIFE =====
      case 'lose_life': {
        const { telegram_id } = body;
        const { data: user } = await supabase.from('users').select('id, lives').eq('telegram_id', telegram_id).single();
        if (!user) return error('User not found', 404);

        const newLives = Math.max(0, user.lives - 1);
        await supabase.from('users').update({ lives: newLives }).eq('id', user.id);
        return ok({ lives: newLives });
      }

      // ===== RESTORE LIVES =====
      case 'restore_lives': {
        const { telegram_id, lives } = body;
        const livesCount = lives || 3;
        await supabase.from('users').update({ lives: livesCount }).eq('telegram_id', telegram_id);
        return ok({ lives: livesCount });
      }

      // ===== BUY SKIN =====
      case 'buy_skin': {
        const { telegram_id, skin_name, price } = body;
        const { data: user } = await supabase.from('users').select('id, stars').eq('telegram_id', telegram_id).single();
        if (!user) return error('User not found', 404);
        if (user.stars < price) return error('Not enough stars', 400);

        const { error: skinErr } = await supabase.from('user_skins').insert({ user_id: user.id, skin_name });
        if (skinErr) return error('Already owned', 400);

        await supabase.from('users').update({ stars: user.stars - price }).eq('id', user.id);
        return ok({ success: true });
      }

      // ===== SELECT SKIN =====
      case 'select_skin': {
        const { telegram_id, skin_name } = body;
        await supabase.from('users').update({ current_skin: skin_name }).eq('telegram_id', telegram_id);
        return ok({ success: true });
      }

      // ===== COMPLETE TASK =====
      case 'complete_task': {
        const { telegram_id, task_id, reward, reward_type } = body;
        const { data: user } = await supabase.from('users').select('id, stars, coins').eq('telegram_id', telegram_id).single();
        if (!user) return error('User not found', 404);

        const { error: taskErr } = await supabase.from('user_tasks').insert({ user_id: user.id, task_id });
        if (taskErr) return error('Already completed', 400);

        const updates: any = {};
        if (reward_type === 'coins') {
          updates.coins = user.coins + (reward || 0);
        } else {
          updates.stars = user.stars + (reward || 0);
        }
        await supabase.from('users').update(updates).eq('id', user.id);
        return ok({ success: true });
      }

      // ===== DAILY BONUS =====
      case 'claim_daily_bonus': {
        const { telegram_id } = body;
        const { data: user } = await supabase.from('users').select('id, stars, coins').eq('telegram_id', telegram_id).single();
        if (!user) return error('User not found', 404);

        let { data: bonus } = await supabase.from('daily_bonus').select('*').eq('user_id', user.id).single();
        const today = new Date().toISOString().split('T')[0];

        if (!bonus) {
          await supabase.from('daily_bonus').insert({ user_id: user.id, day: 1, last_claimed: null });
          bonus = { user_id: user.id, day: 1, last_claimed: null, updated_at: '' };
        }

        if (bonus.last_claimed === today) return error('Already claimed today', 400);

        // Check streak
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        let currentDay = bonus.day;
        if (bonus.last_claimed && bonus.last_claimed !== yesterday) {
          currentDay = 1; // streak broken
        }

        // Days 1-6: stars, Day 7: 50 coins
        const DAILY_STAR_REWARDS = [10, 20, 30, 40, 50, 60];
        let reward = 0;
        let rewardType = 'stars';

        if (currentDay === 7) {
          reward = 50;
          rewardType = 'coins';
          await supabase.from('users').update({ coins: user.coins + 50 }).eq('id', user.id);
        } else {
          reward = DAILY_STAR_REWARDS[currentDay - 1] || 10;
          await supabase.from('users').update({ stars: user.stars + reward }).eq('id', user.id);
        }

        const nextDay = currentDay >= 7 ? 1 : currentDay + 1;
        await supabase.from('daily_bonus').update({ day: nextDay, last_claimed: today }).eq('user_id', user.id);

        return ok({ reward, reward_type: rewardType, day: currentDay, next_day: nextDay });
      }

      // ===== CONVERT STARS TO COINS (atomic, prevents double-click) =====
      case 'convert_stars': {
        const { telegram_id } = body;
        const { data: user } = await supabase.from('users').select('id, stars, coins').eq('telegram_id', telegram_id).single();
        if (!user) return error('User not found', 404);
        if (user.stars < 150000) return error('Not enough stars', 400);

        // Atomic update: only deduct if stars still sufficient
        const { data: updated, error: updateErr } = await supabase.from('users').update({
          stars: user.stars - 150000,
          coins: user.coins + 10000,
        }).eq('id', user.id).gte('stars', 150000).select('stars, coins').single();
        
        if (updateErr || !updated) return error('Not enough stars', 400);
        return ok({ success: true, stars: updated.stars, coins: updated.coins });
      }

      // ===== WITHDRAW =====
      case 'withdraw': {
        const { telegram_id, amount, card_type, card_number } = body;
        const { data: user } = await supabase.from('users').select('id, coins').eq('telegram_id', telegram_id).single();
        if (!user) return error('User not found', 404);
        if (user.coins < amount) return error('Not enough coins', 400);

        await supabase.from('withdraw_requests').insert({
          user_id: user.id, amount, card_type, card_number, status: 'pending',
        });
        await supabase.from('users').update({ coins: user.coins - amount }).eq('id', user.id);
        return ok({ success: true });
      }

      // ===== GET WITHDRAW REQUESTS =====
      case 'get_withdrawals': {
        const { telegram_id, all } = body;
        if (all) {
          const { data } = await supabase.from('withdraw_requests').select('*, users!inner(telegram_id, username)').order('created_at', { ascending: false });
          return ok({ requests: data || [] });
        }
        const { data: user } = await supabase.from('users').select('id').eq('telegram_id', telegram_id).single();
        if (!user) return error('User not found', 404);
        const { data } = await supabase.from('withdraw_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        return ok({ requests: data || [] });
      }

      // ===== UPDATE WITHDRAW =====
      case 'update_withdrawal': {
        const { id, status, reason } = body;
        await supabase.from('withdraw_requests').update({ status, ...(reason && { reason }) }).eq('id', id);
        return ok({ success: true });
      }

      // ===== ADMIN: GET ALL USERS =====
      case 'get_all_users': {
        const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        return ok({ users: data || [] });
      }

      // ===== ADMIN: GIVE/REMOVE =====
      case 'admin_balance': {
        const { telegram_id, stars_delta, coins_delta } = body;
        const { data: user } = await supabase.from('users').select('id, stars, coins').eq('telegram_id', telegram_id).single();
        if (!user) return error('User not found', 404);

        const updates: any = {};
        if (stars_delta !== undefined) updates.stars = Math.max(0, user.stars + stars_delta);
        if (coins_delta !== undefined) updates.coins = Math.max(0, user.coins + coins_delta);
        await supabase.from('users').update(updates).eq('id', user.id);
        return ok({ success: true });
      }

      // ===== ADMIN TASKS CRUD =====
      case 'get_admin_tasks': {
        const { data } = await supabase.from('admin_tasks').select('*').eq('is_active', true).order('created_at', { ascending: false });
        return ok({ tasks: data || [] });
      }

      case 'add_admin_task': {
        const { label, reward, reward_type, icon, channel_url, channel_id } = body;
        const { data, error: err } = await supabase.from('admin_tasks').insert({
          label, reward, reward_type, icon, channel_url, channel_id,
        }).select().single();
        if (err) return error(err.message, 500);
        return ok({ task: data });
      }

      case 'remove_admin_task': {
        const { id } = body;
        await supabase.from('admin_tasks').update({ is_active: false }).eq('id', id);
        return ok({ success: true });
      }

      // ===== WATCH AD (15 stars, 500/day limit, resets 00:00 UZT) =====
      case 'watch_ad': {
        const { telegram_id } = body;
        const { data: user } = await supabase.from('users').select('id, stars').eq('telegram_id', telegram_id).single();
        if (!user) return error('User not found', 404);

        // Get today's date in UZB timezone (UTC+5)
        const now = new Date();
        const uzbOffset = 5 * 60 * 60 * 1000;
        const uzbNow = new Date(now.getTime() + uzbOffset);
        const todayUZB = uzbNow.toISOString().split('T')[0];
        const todayStart = new Date(`${todayUZB}T00:00:00+05:00`).toISOString();
        const tomorrowStart = new Date(new Date(`${todayUZB}T00:00:00+05:00`).getTime() + 86400000).toISOString();

        // Count today's ads
        const { count } = await supabase.from('ad_views')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', todayStart)
          .lt('created_at', tomorrowStart);

        const todayCount = count || 0;
        if (todayCount >= 500) return error('Daily limit reached', 400);

        // Record ad view
        await supabase.from('ad_views').insert({ user_id: user.id });

        // Give 15 stars
        await supabase.from('users').update({ stars: user.stars + 15 }).eq('id', user.id);

        return ok({ success: true, stars_earned: 15, today_count: todayCount + 1, daily_limit: 500 });
      }

      // ===== GET USER AD COUNT =====
      case 'get_user_ad_count': {
        const { telegram_id } = body;
        const { data: user } = await supabase.from('users').select('id').eq('telegram_id', telegram_id).single();
        if (!user) return error('User not found', 404);

        const now = new Date();
        const uzbOffset = 5 * 60 * 60 * 1000;
        const uzbNow = new Date(now.getTime() + uzbOffset);
        const todayUZB = uzbNow.toISOString().split('T')[0];
        const todayStart = new Date(`${todayUZB}T00:00:00+05:00`).toISOString();
        const tomorrowStart = new Date(new Date(`${todayUZB}T00:00:00+05:00`).getTime() + 86400000).toISOString();

        const { count } = await supabase.from('ad_views')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', todayStart)
          .lt('created_at', tomorrowStart);

        return ok({ today_count: count || 0, daily_limit: 500 });
      }

      // ===== ADMIN: AD STATS =====
      case 'get_ad_stats': {
        const now = new Date();
        const uzbOffset = 5 * 60 * 60 * 1000;
        const uzbNow = new Date(now.getTime() + uzbOffset);
        const todayUZB = uzbNow.toISOString().split('T')[0];
        const todayStart = new Date(`${todayUZB}T00:00:00+05:00`).toISOString();
        const tomorrowStart = new Date(new Date(`${todayUZB}T00:00:00+05:00`).getTime() + 86400000).toISOString();

        const { count: totalAds } = await supabase.from('ad_views')
          .select('*', { count: 'exact', head: true });

        const { count: todayAds } = await supabase.from('ad_views')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart)
          .lt('created_at', tomorrowStart);

        return ok({ total_ads: totalAds || 0, today_ads: todayAds || 0 });
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
