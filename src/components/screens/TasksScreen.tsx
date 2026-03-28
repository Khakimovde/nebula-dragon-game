import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Check, Hash, Gift, ExternalLink, Loader2 } from 'lucide-react';
import AdComponent from '@/components/AdComponent';
import { toast } from 'sonner';

const tasks = [
  { id: 'ad_watch', label: 'Reklama ko\'rish', reward: 10, icon: '📺', repeatable: true },
];

const DAILY_BONUS = [
  { day: 1, reward: 10, type: 'stars' },
  { day: 2, reward: 20, type: 'stars' },
  { day: 3, reward: 30, type: 'stars' },
  { day: 4, reward: 40, type: 'stars' },
  { day: 5, reward: 50, type: 'stars' },
  { day: 6, reward: 60, type: 'stars' },
  { day: 7, reward: 50, type: 'coins' },
];

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
  const { user, completeTask, addStars, claimDailyBonus, dailyBonusDay, canClaimDailyBonus, adminTasks } = useGame();
  const [verifying, setVerifying] = useState<string | null>(null);
  const [dailyAdsWatched, setDailyAdsWatched] = useState(0);
  const [dailyAdTypes, setDailyAdTypes] = useState<{ monetag: boolean; onclicka: boolean }>({ monetag: false, onclicka: false });

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
    // Track which type was watched (alternating via AdComponent)
    if (newCount === 1) {
      setDailyAdTypes(prev => ({ ...prev, monetag: true }));
    } else if (newCount === 2) {
      setDailyAdTypes(prev => ({ ...prev, onclicka: true }));
    }
  };

  const handleClaimDailyBonus = () => {
    if (dailyAdsWatched < 2) {
      toast.error('Avval 2 ta reklama ko\'ring!');
      return;
    }
    claimDailyBonus();
    setDailyAdsWatched(0);
    setDailyAdTypes({ monetag: false, onclicka: false });
  };

  const dailyBonusReady = dailyAdsWatched >= 2 && canClaimDailyBonus;

  return (
    <div className="px-4 pt-2 pb-4">
      <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
        <Hash className="text-accent" size={24} /> Vazifalar
      </h2>

      {/* Daily Bonus */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="text-accent" size={20} />
          <span className="font-bold text-sm text-foreground">Kunlik bonus</span>
          <span className="text-xs text-muted-foreground ml-auto">Kun {dailyBonusDay}/7</span>
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

      {/* Tasks */}
      <div className="flex flex-col gap-3">
        {tasks.map(task => {
          if (task.id === 'ad_watch') {
            return (
              <div key={task.id} className="game-card flex items-center gap-3">
                <span className="text-2xl">{task.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-foreground">{task.label}</p>
                  <p className="text-xs text-accent">+{task.reward} ⭐</p>
                </div>
                <AdComponent
                  onReward={() => addStars(task.reward)}
                  className="btn-neon text-xs py-1.5 px-3 watch-ad"
                >
                  Ko'rish
                </AdComponent>
              </div>
            );
          }

          const done = user.tasks_done.includes(task.id) && !task.repeatable;
          return (
            <div key={task.id} className="game-card flex items-center gap-3">
              <span className="text-2xl">{task.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground">{task.label}</p>
                <p className="text-xs text-accent">+{task.reward} ⭐</p>
              </div>
              {done ? (
                <span className="text-primary"><Check size={20} /></span>
              ) : (
                <button onClick={() => completeTask(task.id, task.reward)} className="btn-neon text-xs py-1.5 px-3">
                  Bajarish
                </button>
              )}
            </div>
          );
        })}

        {/* Admin-added channel tasks */}
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
