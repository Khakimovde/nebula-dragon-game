import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const UZB_OFFSET = 5 * 60 * 60 * 1000;

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const results: any = { wheel: null, leaderboard: null };

  // ---- WHEEL PROCESSING ----
  // Find active rounds that have expired (round started 2+ hours ago)
  const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();

  const { data: expiredRounds } = await supabase
    .from('wheel_rounds')
    .select('*')
    .eq('status', 'active')
    .lte('round_time', twoHoursAgo);

  if (expiredRounds && expiredRounds.length > 0) {
    for (const round of expiredRounds) {
      const { data: participants } = await supabase
        .from('wheel_participants')
        .select('user_id')
        .eq('round_id', round.id);

      if (participants && participants.length > 0) {
        // Pick random winner
        const winner = participants[Math.floor(Math.random() * participants.length)];

        const { data: winnerUser } = await supabase
          .from('users')
          .select('id, username, first_name, photo_url, stars')
          .eq('id', winner.user_id)
          .single();

        if (winnerUser) {
          // Give 3000 stars to winner
          await supabase.from('users')
            .update({ stars: winnerUser.stars + 3000 })
            .eq('id', winnerUser.id);

          // Give 50 stars to each loser
          const loserIds = participants
            .filter((p: any) => p.user_id !== winnerUser.id)
            .map((p: any) => p.user_id);

          for (const loserId of loserIds) {
            const { data: loser } = await supabase
              .from('users')
              .select('id, stars')
              .eq('id', loserId)
              .single();
            if (loser) {
              await supabase.from('users')
                .update({ stars: loser.stars + 50 })
                .eq('id', loser.id);
            }
          }

          // Update round with winner info
          await supabase.from('wheel_rounds')
            .update({
              status: 'completed',
              winner_id: winnerUser.id,
              winner_username: winnerUser.username || winnerUser.first_name || 'Player',
              winner_photo_url: winnerUser.photo_url,
              participant_count: participants.length,
              reward_stars: 3000,
            })
            .eq('id', round.id);
        }
      } else {
        // No participants
        await supabase.from('wheel_rounds')
          .update({ status: 'completed', participant_count: 0 })
          .eq('id', round.id);
      }
    }
    results.wheel = { processed: expiredRounds.length };
  }

  // ---- WEEKLY LEADERBOARD (Monday 00:01 UZT) ----
  const uztNow = new Date(Date.now() + UZB_OFFSET);
  const dayOfWeek = uztNow.getUTCDay(); // 0=Sun, 1=Mon
  const hour = uztNow.getUTCHours();
  const minute = uztNow.getUTCMinutes();

  // Process on Monday between 00:01 and 00:10 UZT
  if (dayOfWeek === 1 && hour === 0 && minute >= 1 && minute <= 10) {
    // Calculate previous week Monday
    const prevMonday = new Date(uztNow);
    prevMonday.setUTCDate(prevMonday.getUTCDate() - 7);
    const prevMondayStr = prevMonday.toISOString().split('T')[0];

    // Check if already processed
    const { data: existing } = await supabase
      .from('leaderboard_history')
      .select('id')
      .eq('week_start', prevMondayStr)
      .limit(1);

    if (!existing || existing.length === 0) {
      // Previous week bounds
      const weekStart = new Date(`${prevMondayStr}T00:01:00+05:00`).toISOString();
      const thisMondayStr = uztNow.toISOString().split('T')[0];
      const weekEnd = new Date(`${thisMondayStr}T00:01:00+05:00`).toISOString();

      const { data: referrals } = await supabase
        .from('referrals')
        .select('referrer_id')
        .gte('created_at', weekStart)
        .lt('created_at', weekEnd);

      if (referrals && referrals.length > 0) {
        const counts: Record<string, number> = {};
        referrals.forEach((r: any) => {
          counts[r.referrer_id] = (counts[r.referrer_id] || 0) + 1;
        });

        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20);

        const REWARDS = Array.from({ length: 20 }, (_, i) => 1000 - i * 50);

        for (let i = 0; i < sorted.length; i++) {
          const [userId, refCount] = sorted[i];
          const reward = REWARDS[i];

          // Give coins
          const { data: u } = await supabase
            .from('users')
            .select('coins')
            .eq('id', userId)
            .single();

          if (u) {
            await supabase.from('users')
              .update({ coins: u.coins + reward })
              .eq('id', userId);
          }

          // Record history
          await supabase.from('leaderboard_history').insert({
            user_id: userId,
            week_start: prevMondayStr,
            rank: i + 1,
            referral_count: refCount,
            reward_coins: reward,
          });
        }

        results.leaderboard = { processed: sorted.length };
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, ...results }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
