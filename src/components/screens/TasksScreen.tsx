import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Check, Hash, ExternalLink, Loader2 } from 'lucide-react';
import AdComponent from '@/components/AdComponent';
import { toast } from 'sonner';
import giftIcon from '@/assets/icon-gift.png';
import adIcon from '@/assets/icon-ad.png';
import referralIcon from '@/assets/icon-referral.png';

const DAILY_BONUS = [
  { day: 1, reward: 10, type: 'stars' },
  { day: 2, reward: 20, type: 'stars' },
  { day: 3, reward: 30, type: 'stars' },
  { day: 4, reward: 40, type: 'stars' },
  { day: 5, reward: 50, type: 'stars' },
  { day: 6, reward: 60, type: 'stars' },
  { day: 7, reward: 50, type: 'coins' },
];

const gameApiFn = async (action: string, body: any = {}) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const res = await fetch(`${supabaseUrl}/functions/v1/game-api?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};

async function checkChannelSubscription(chatId: string, userTelegramId: number): Promise<boolean> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    const res = await fetch(`${supabaseUrl}/functions/v1/telegram-check?action=check_subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        chat_id: chatId,
        user_telegram_id: userTelegramId,
      }),
    });
    const data = await res.json();
    return data.subscribed === true;
  } catch {
    return false;
  }
}

const TasksScreen: React.FC = () => {
  const { user, completeTask, claimDailyBonus, dailyBonusDay, canClaimDailyBonus, adminTasks, watchAdForStars, userAdCount, adDailyLimit } = useGame();
  const [verifying, setVerifying] = useState<string | null>(null);
  const [dailyAdsWatched, setDailyAdsWatched] = useState(0);
  const [adLoading, setAdLoading] = useState(false);

  // Daily referral task state
  const [dailyRefCount, setDailyRefCount] = useState(0);
  const [dailyRefClaimed, setDailyRefClaimed] = useState(false);
  const [dailyRefLoading, setDailyRefLoading] = useState(false);

  const loadDailyReferralProgress = useCallback(async () => {
    try {
      const data = await gameApiFn('get_daily_referral_progress', { telegram_id: user.telegram_id });
      setDailyRefCount(data.referral_count || 0);
      setDailyRefClaimed(data.reward_claimed || false);
    } catch {}
  }, [user.telegram_id]);

  useEffect(() => {
    if (user.telegram_id) {
      loadDailyReferralProgress();
    }
  }, [user.telegram_id, loadDailyReferralProgress]);

  const handleClaimDailyReferral = async () => {
    if (dailyRefLoading || dailyRefClaimed || dailyRefCount < 15) return;
    setDailyRefLoading(true);
    try {
      await gameApiFn('claim_daily_referral_reward', { telegram_id: user.telegram_id });
      setDailyRefClaimed(true);
      toast.success('+8,000 ⭐ olindi!');
    } catch (e: any) {
      toast.error(e.message || 'Xatolik');
    } finally {
      setDailyRefLoading(false);
    }
  };

  const handleChannelTask = async (task: typeof adminTasks[0]) => {
    window.open(task.channelUrl, '_blank');
  };

  const handleVerifySubscription = async (task: typeof adminTasks[0]) => {
    const taskKey = `admin_${task.id}`;
    if (user.tasks_done.includes(taskKey)) return;

    setVerifying(task.id);
    try {
      const chatId = task.channelId || task.channelUrl.replace('https://t.me/', '@');
      const isSubscribed = await checkChannelSubscription(chatId, user.telegram_id);
      
      if (isSubscribed) {
        completeTask(taskKey, task.reward);
        toast.success(`+${task.reward} ${task.rewardType === 'coins' ? '🪙' : '⭐'} olindi!`);
      } else {
        toast.error('Obuna bo\'lmagansiz! Avval kanalga obuna bo\'ling.');
      }
    } catch {
      toast.error('Tekshirishda xatolik yuz berdi');
    } finally {
      setVerifying(null);
    }
  };

  const handleDailyAdReward = () => {
    const newCount = dailyAdsWatched + 1;
    setDailyAdsWatched(newCount);
  };

  const handleClaimDailyBonus = () => {
    if (dailyAdsWatched < 2) {
      toast.error('Avval 2 ta reklama ko\'ring!');
      return;
    }
    claimDailyBonus();
    setDailyAdsWatched(0);
  };

  const handleAdStarReward = async () => {
    setAdLoading(true);
    const result = await watchAdForStars();
    setAdLoading(false);
    if (result.success) {
      toast.success(`+15 ⭐ olindi! (${result.today_count}/${adDailyLimit})`);
    } else {
      toast.error('Kunlik limit tugagan!');
    }
  };

  const dailyBonusReady = dailyAdsWatched >= 2 && canClaimDailyBonus;
  const adLimitReached = userAdCount >= adDailyLimit;

  return (
    <div className="px-4 pt-2 pb-4">
      <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
        <Hash className="text-accent" size={24} /> Vazifalar
      </h2>

      {/* Daily Bonus - kattaroq */}
      <div className="game-card mb-4 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-3">
          <img src={giftIcon} alt="" className="w-14 h-14 bounce-anim" />
          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground">🎁 Kunlik bonus</h3>
            <span className="text-xs text-muted-foreground">Kun {dailyBonusDay}/7</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-3">
          {DAILY_BONUS.map((bonus, i) => {
            const claimed = i < dailyBonusDay - 1;
            const current = i === dailyBonusDay - 1 && canClaimDailyBonus;
            return (
              <div
                key={bonus.day}
                className={`flex flex-col items-center p-1 rounded-lg text-center ${
                  claimed ? 'bg-primary/20' : current ? 'bg-accent/20 ring-1 ring-accent' : 'bg-muted/50'
                }`}
              >
                <span className="text-[9px] text-muted-foreground">{bonus.day}</span>
                <span className="text-xs font-bold text-foreground">{bonus.type === 'coins' ? '🪙' : '⭐'}</span>
                <span className="text-[10px] font-bold text-foreground">{bonus.reward}</span>
                {claimed && <Check size={10} className="text-primary" />}
              </div>
            );
          })}
        </div>
        
        {canClaimDailyBonus ? (
          <div className="flex flex-col gap-2">
            {dailyAdsWatched < 2 && (
              <>
                <p className="text-xs text-muted-foreground text-center">
                  Bonus olish uchun 2 ta reklama ko'ring ({dailyAdsWatched}/2)
                </p>
                <AdComponent
                  onReward={handleDailyAdReward}
                  className="btn-neon w-full text-sm py-2 watch-ad"
                >
                  📺 Reklama ko'rish ({dailyAdsWatched}/2)
                </AdComponent>
              </>
            )}
            <button
              onClick={handleClaimDailyBonus}
              disabled={!dailyBonusReady}
              className={dailyBonusReady ? 'btn-gold w-full text-sm py-2' : 'w-full py-2 rounded-xl bg-muted text-muted-foreground font-bold cursor-not-allowed text-sm'}
            >
              {dailyBonusReady ? '🎁 Bonus olish' : `📺 ${2 - dailyAdsWatched} ta reklama qoldi`}
            </button>
          </div>
        ) : (
          <button
            disabled
            className="w-full py-2 rounded-xl bg-muted text-muted-foreground font-bold cursor-not-allowed text-sm"
          >
            ✅ Bugun olingan
          </button>
        )}
      </div>

      {/* Daily Referral Task - PNG bilan */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-3 mb-3">
          <img src={referralIcon} alt="" className="w-12 h-12 float-anim" />
          <div className="flex-1">
            <h3 className="font-bold text-base text-foreground">👥 Kunlik referal vazifasi</h3>
            <span className="text-[11px] text-muted-foreground">Har kuni 00:01 da yangilanadi</span>
          </div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Bugun chaqirilgan:</span>
          <span className={`font-bold text-sm ${dailyRefCount >= 15 ? 'text-primary' : 'text-foreground'}`}>
            {dailyRefCount}/15
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-3">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, (dailyRefCount / 15) * 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-accent">Mukofot: 8,000 ⭐</span>
          <span className="text-[10px] text-muted-foreground">UZB 00:01 da yangilanadi</span>
        </div>
        {dailyRefClaimed ? (
          <button
            disabled
            className="w-full py-2 rounded-xl bg-muted text-muted-foreground font-bold cursor-not-allowed text-sm"
          >
            ✅ Bugun olingan
          </button>
        ) : dailyRefCount >= 15 ? (
          <button
            onClick={handleClaimDailyReferral}
            disabled={dailyRefLoading}
            className="btn-gold w-full text-sm py-2"
          >
            {dailyRefLoading ? '⏳ Yuklanmoqda...' : '🎁 8,000 ⭐ olish'}
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2 rounded-xl bg-muted text-muted-foreground font-bold cursor-not-allowed text-sm"
          >
            👥 {15 - dailyRefCount} ta referal qoldi
          </button>
        )}
      </div>

      {/* Ad watch for stars - PNG bilan */}
      <div className="game-card mb-4 flex items-center gap-3">
        <img src={adIcon} alt="" className="w-14 h-14 bounce-anim" />
        <div className="flex-1">
          <p className="font-bold text-base text-foreground">📺 Reklama ko'rish</p>
          <p className="text-sm text-accent font-bold">+15 ⭐ har bir reklama</p>
          <p className="text-[11px] text-muted-foreground">{userAdCount}/{adDailyLimit} kunlik limit</p>
        </div>
        {adLimitReached ? (
          <span className="text-xs text-muted-foreground font-bold px-3 py-1.5 bg-muted rounded-lg">Limit</span>
        ) : (
          <AdComponent
            onReward={handleAdStarReward}
            className="btn-neon text-sm py-2 px-4 watch-ad"
          >
            Ko'rish
          </AdComponent>
        )}
      </div>

      {/* Admin-added channel tasks */}
      <div className="flex flex-col gap-3">
        {adminTasks.map(task => {
          const done = user.tasks_done.includes(`admin_${task.id}`);
          const isVerifying = verifying === task.id;
          
          return (
            <div key={task.id} className="game-card flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{task.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-foreground">{task.label}</p>
                  <p className="text-xs text-accent">+{task.reward} {task.rewardType === 'coins' ? '🪙' : '⭐'}</p>
                </div>
                {done && <span className="text-primary"><Check size={20} /></span>}
              </div>
              {!done && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleChannelTask(task)}
                    className="flex-1 btn-neon text-xs py-1.5 flex items-center justify-center gap-1"
                  >
                    <ExternalLink size={12} /> Kanalga o'tish
                  </button>
                  <button
                    onClick={() => handleVerifySubscription(task)}
                    disabled={isVerifying}
                    className="flex-1 btn-gold text-xs py-1.5 flex items-center justify-center gap-1"
                  >
                    {isVerifying ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    {isVerifying ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TasksScreen;
