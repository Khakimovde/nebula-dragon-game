import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id?: string;
  telegram_id: number;
  username: string;
  first_name?: string;
  photo_url?: string;
  stars: number;
  coins: number;
  lives: number;
  skins: string[];
  current_skin: string;
  referrals: number;
  referral_code: string;
  tasks_done: string[];
  created_at: Date;
}

export interface WithdrawRequest {
  id: string;
  user_id: string;
  amount: number;
  card_type: 'uzcard' | 'humo';
  card_number: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  reason?: string;
  created_at: Date;
}

export interface AdminTask {
  id: string;
  label: string;
  reward: number;
  rewardType: 'stars' | 'coins';
  icon: string;
  channelUrl: string;
  channelId?: string;
}

interface GameState {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  addStars: (amount: number) => void;
  spendStars: (amount: number) => boolean;
  convertStarsToCoins: () => Promise<boolean>;
  loseLife: () => boolean;
  restoreLives: () => void;
  buySkin: (skinName: string, price: number) => Promise<boolean>;
  selectSkin: (skinName: string) => void;
  addReferral: () => void;
  completeTask: (taskId: string, reward: number) => void;
  withdrawRequests: WithdrawRequest[];
  addWithdrawRequest: (req: Omit<WithdrawRequest, 'id' | 'created_at'>) => void;
  updateWithdrawRequest: (id: string, status: WithdrawRequest['status'], reason?: string) => void;
  isAdmin: boolean;
  allUsers: any[];
  adminGiveStars: (userId: number, amount: number) => void;
  adminGiveCoins: (userId: number, amount: number) => void;
  adminRemoveStars: (userId: number, amount: number) => void;
  adminRemoveCoins: (userId: number, amount: number) => void;
  adminTasks: AdminTask[];
  addAdminTask: (task: Omit<AdminTask, 'id'>) => void;
  removeAdminTask: (id: string) => void;
  dailyBonusDay: number;
  canClaimDailyBonus: boolean;
  claimDailyBonus: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
  watchAdForCoins: () => Promise<{ success: boolean; today_count: number; coins_earned: number }>;
  userAdCount: number;
  adDailyLimit: number;
  adStats: { total_ads: number; today_ads: number };
}

const ADMIN_ID = 7411640202;

const defaultUser: User = {
  telegram_id: 123456789,
  username: 'Player',
  stars: 0,
  coins: 0,
  lives: 3,
  skins: ['green'],
  current_skin: 'green',
  referrals: 0,
  referral_code: 'REF_123456789',
  tasks_done: [],
  created_at: new Date(),
};

function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

function getTelegramUser() {
  try {
    // @ts-expect-error Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      return {
        telegram_id: u.id,
        username: u.username || '',
        first_name: u.first_name || '',
        photo_url: u.photo_url || '',
      };
    }
  } catch {}
  return null;
}

function getTelegramStartParam(): string | null {
  try {
    // @ts-expect-error Telegram WebApp
    const tg = window.Telegram?.WebApp;
    return tg?.initDataUnsafe?.start_param || null;
  } catch {}
  return null;
}

async function gameApi(action: string, body: any = {}) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const url = `${supabaseUrl}/functions/v1/game-api?action=${action}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

const GameContext = createContext<GameState | null>(null);

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(defaultUser);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [dailyBonusDay, setDailyBonusDay] = useState(1);
  const [lastClaimed, setLastClaimed] = useState<string | null>(null);
  const [adminTasks, setAdminTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAdCount, setUserAdCount] = useState(0);
  const [adDailyLimit] = useState(500);
  const [adStats, setAdStats] = useState({ total_ads: 0, today_ads: 0 });

  const today = getDateString();
  const canClaimDailyBonus = lastClaimed !== today;

  useEffect(() => {
    loadUser();
    loadAdminTasks();
    loadUserAdCount();
  }, []);

  const loadUser = async () => {
    try {
      const tgUser = getTelegramUser();
      const startParam = getTelegramStartParam();

      const telegramId = tgUser?.telegram_id || 123456789;
      const data = await gameApi('get_or_create_user', {
        telegram_id: telegramId,
        username: tgUser?.username || 'Player',
        first_name: tgUser?.first_name || '',
        photo_url: tgUser?.photo_url || '',
        referral_code_used: startParam || null,
      });

      const u = data.user;
      const loadedUser: User = {
        id: u.id,
        telegram_id: u.telegram_id,
        username: u.username || u.first_name || 'Player',
        first_name: u.first_name,
        photo_url: u.photo_url,
        stars: u.stars,
        coins: u.coins,
        lives: u.lives,
        skins: u.skins || ['green'],
        current_skin: u.current_skin,
        referrals: u.referrals,
        referral_code: u.referral_code,
        tasks_done: u.tasks_done || [],
        created_at: new Date(u.created_at),
      };
      setUser(loadedUser);

      if (data.daily_bonus) {
        setDailyBonusDay(data.daily_bonus.day);
        setLastClaimed(data.daily_bonus.last_claimed);
      }

      // Load user's own withdrawal history
      loadUserWithdrawals(u.telegram_id);

      // Load admin data if admin
      if (u.telegram_id === ADMIN_ID) {
        loadAdminData();
      }
    } catch (e) {
      console.error('Failed to load user:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadUserWithdrawals = async (telegramId: number) => {
    try {
      const data = await gameApi('get_withdrawals', { telegram_id: telegramId });
      setWithdrawRequests((data.requests || []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        amount: r.amount,
        card_type: r.card_type,
        card_number: r.card_number,
        status: r.status,
        reason: r.reason,
        created_at: new Date(r.created_at),
      })));
    } catch (e) {
      console.error('Failed to load withdrawals:', e);
    }
  };

  const loadAdminData = async () => {
    try {
      const [usersData, withdrawData] = await Promise.all([
        gameApi('get_all_users'),
        gameApi('get_withdrawals', { all: true }),
      ]);
      setAllUsers(usersData.users || []);
      setWithdrawRequests((withdrawData.requests || []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        amount: r.amount,
        card_type: r.card_type,
        card_number: r.card_number,
        status: r.status,
        reason: r.reason,
        created_at: new Date(r.created_at),
      })));
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }
  };

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, []);

  const loadAdminTasks = async () => {
    try {
      const data = await gameApi('get_admin_tasks');
      setAdminTasks((data.tasks || []).map((t: any) => ({
        id: t.id,
        label: t.label,
        reward: t.reward,
        rewardType: t.reward_type,
        icon: t.icon,
        channelUrl: t.channel_url,
        channelId: t.channel_id,
      })));
    } catch (e) {
      console.error('Failed to load admin tasks:', e);
    }
  };

  const addStars = useCallback((amount: number) => {
    setUser(prev => ({ ...prev, stars: prev.stars + amount }));
    gameApi('update_balance', { telegram_id: user.telegram_id, stars_delta: amount }).catch(() => {});
  }, [user.telegram_id]);

  const spendStars = useCallback((amount: number): boolean => {
    let success = false;
    setUser(prev => {
      if (prev.stars >= amount) {
        success = true;
        return { ...prev, stars: prev.stars - amount };
      }
      return prev;
    });
    if (success) {
      gameApi('update_balance', { telegram_id: user.telegram_id, stars_delta: -amount }).catch(() => {});
    }
    return success;
  }, [user.telegram_id]);

  const convertStarsToCoins = useCallback(async (): Promise<boolean> => {
    if (user.stars < 150000) return false;
    try {
      await gameApi('convert_stars', { telegram_id: user.telegram_id });
      setUser(prev => ({ ...prev, stars: prev.stars - 150000, coins: prev.coins + 10000 }));
      return true;
    } catch {
      return false;
    }
  }, [user.telegram_id, user.stars]);

  const loseLife = useCallback((): boolean => {
    let alive = true;
    setUser(prev => {
      const newLives = prev.lives - 1;
      if (newLives <= 0) alive = false;
      return { ...prev, lives: Math.max(0, newLives) };
    });
    gameApi('lose_life', { telegram_id: user.telegram_id }).catch(() => {});
    return alive;
  }, [user.telegram_id]);

  const restoreLives = useCallback(() => {
    setUser(prev => ({ ...prev, lives: 3 }));
    gameApi('restore_lives', { telegram_id: user.telegram_id }).catch(() => {});
  }, [user.telegram_id]);

  const buySkin = useCallback(async (skinName: string, price: number): Promise<boolean> => {
    if (user.stars < price || user.skins.includes(skinName)) return false;
    try {
      await gameApi('buy_skin', { telegram_id: user.telegram_id, skin_name: skinName, price });
      setUser(prev => ({
        ...prev,
        stars: prev.stars - price,
        skins: [...prev.skins, skinName],
      }));
      return true;
    } catch {
      return false;
    }
  }, [user.telegram_id, user.stars, user.skins]);

  const selectSkin = useCallback((skinName: string) => {
    setUser(prev => prev.skins.includes(skinName) ? { ...prev, current_skin: skinName } : prev);
    gameApi('select_skin', { telegram_id: user.telegram_id, skin_name: skinName }).catch(() => {});
  }, [user.telegram_id]);

  const addReferral = useCallback(() => {
    setUser(prev => ({ ...prev, referrals: prev.referrals + 1, stars: prev.stars + 100 }));
  }, []);

  const completeTask = useCallback((taskId: string, reward: number) => {
    setUser(prev => {
      if (prev.tasks_done.includes(taskId)) return prev;
      return { ...prev, tasks_done: [...prev.tasks_done, taskId], stars: prev.stars + reward };
    });
    gameApi('complete_task', {
      telegram_id: user.telegram_id,
      task_id: taskId,
      reward,
      reward_type: 'stars',
    }).catch(() => {});
  }, [user.telegram_id]);

  const addWithdrawRequest = useCallback((req: Omit<WithdrawRequest, 'id' | 'created_at'>) => {
    setUser(prev => ({ ...prev, coins: prev.coins - req.amount }));
    gameApi('withdraw', {
      telegram_id: user.telegram_id,
      amount: req.amount,
      card_type: req.card_type,
      card_number: req.card_number,
    }).then(() => {
      // Reload withdrawals after submitting
      loadUserWithdrawals(user.telegram_id);
    }).catch(() => {});
  }, [user.telegram_id]);

  const updateWithdrawRequest = useCallback((id: string, status: WithdrawRequest['status'], reason?: string) => {
    setWithdrawRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status, reason } : r)
    );
    gameApi('update_withdrawal', { id, status, reason }).catch(() => {});
  }, []);

  const isAdmin = user.telegram_id === ADMIN_ID;

  const adminGiveStars = useCallback((userId: number, amount: number) => {
    gameApi('admin_balance', { telegram_id: userId, stars_delta: amount }).catch(() => {});
    if (userId === user.telegram_id) {
      setUser(prev => ({ ...prev, stars: prev.stars + amount }));
    }
  }, [user.telegram_id]);

  const adminGiveCoins = useCallback((userId: number, amount: number) => {
    gameApi('admin_balance', { telegram_id: userId, coins_delta: amount }).catch(() => {});
    if (userId === user.telegram_id) {
      setUser(prev => ({ ...prev, coins: prev.coins + amount }));
    }
  }, [user.telegram_id]);

  const adminRemoveStars = useCallback((userId: number, amount: number) => {
    gameApi('admin_balance', { telegram_id: userId, stars_delta: -amount }).catch(() => {});
    if (userId === user.telegram_id) {
      setUser(prev => ({ ...prev, stars: Math.max(0, prev.stars - amount) }));
    }
  }, [user.telegram_id]);

  const adminRemoveCoins = useCallback((userId: number, amount: number) => {
    gameApi('admin_balance', { telegram_id: userId, coins_delta: -amount }).catch(() => {});
    if (userId === user.telegram_id) {
      setUser(prev => ({ ...prev, coins: Math.max(0, prev.coins - amount) }));
    }
  }, [user.telegram_id]);

  const addAdminTask = useCallback(async (task: Omit<AdminTask, 'id'>) => {
    try {
      const data = await gameApi('add_admin_task', {
        label: task.label,
        reward: task.reward,
        reward_type: task.rewardType,
        icon: task.icon,
        channel_url: task.channelUrl,
        channel_id: task.channelId,
      });
      setAdminTasks(prev => [...prev, {
        id: data.task.id,
        label: task.label,
        reward: task.reward,
        rewardType: task.rewardType,
        icon: task.icon,
        channelUrl: task.channelUrl,
        channelId: task.channelId,
      }]);
    } catch (e) {
      console.error('Failed to add task:', e);
    }
  }, []);

  const removeAdminTask = useCallback((id: string) => {
    setAdminTasks(prev => prev.filter(t => t.id !== id));
    gameApi('remove_admin_task', { id }).catch(() => {});
  }, []);

  const claimDailyBonus = useCallback(async () => {
    if (!canClaimDailyBonus) return;
    try {
      const data = await gameApi('claim_daily_bonus', { telegram_id: user.telegram_id });
      if (data.reward_type === 'coins') {
        setUser(prev => ({ ...prev, coins: prev.coins + data.reward }));
      } else {
        setUser(prev => ({ ...prev, stars: prev.stars + data.reward }));
      }
      setDailyBonusDay(data.next_day);
      setLastClaimed(today);
    } catch (e) {
      console.error('Failed to claim bonus:', e);
    }
  }, [canClaimDailyBonus, user.telegram_id, today]);

  const loadUserAdCount = useCallback(async () => {
    try {
      const data = await gameApi('get_user_ad_count', { telegram_id: user.telegram_id });
      setUserAdCount(data.today_count || 0);
    } catch {}
  }, [user.telegram_id]);

  const watchAdForCoins = useCallback(async () => {
    try {
      const data = await gameApi('watch_ad', { telegram_id: user.telegram_id });
      if (data.success) {
        setUser(prev => ({ ...prev, coins: prev.coins + 15 }));
        setUserAdCount(data.today_count);
        return { success: true, today_count: data.today_count, coins_earned: 15 };
      }
      return { success: false, today_count: userAdCount, coins_earned: 0 };
    } catch {
      return { success: false, today_count: userAdCount, coins_earned: 0 };
    }
  }, [user.telegram_id, userAdCount]);

  const loadAdStats = useCallback(async () => {
    try {
      const data = await gameApi('get_ad_stats');
      setAdStats({ total_ads: data.total_ads || 0, today_ads: data.today_ads || 0 });
    } catch {}
  }, []);

  useEffect(() => {
    if (isAdmin) loadAdStats();
  }, [isAdmin, loadAdStats]);

  return (
    <GameContext.Provider value={{
      user, setUser, addStars, spendStars, convertStarsToCoins,
      loseLife, restoreLives, buySkin, selectSkin,
      addReferral, completeTask,
      withdrawRequests, addWithdrawRequest, updateWithdrawRequest,
      isAdmin, allUsers, adminGiveStars, adminGiveCoins, adminRemoveStars, adminRemoveCoins,
      adminTasks, addAdminTask, removeAdminTask,
      dailyBonusDay, canClaimDailyBonus, claimDailyBonus,
      loading, refreshUser, watchAdForCoins, userAdCount, adDailyLimit, adStats,
    }}>
      {children}
    </GameContext.Provider>
  );
};
