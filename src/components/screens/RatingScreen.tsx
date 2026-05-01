import React, { useEffect, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Trophy, Crown, User } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  user: { id: string; username?: string; first_name?: string; photo_url?: string };
  referral_count: number;
  reward_coins: number;
}

const REWARDS = Array.from({ length: 20 }, (_, i) => 1000 - i * 50);

const RatingScreen: React.FC = () => {
  const { user } = useGame();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [nextReset, setNextReset] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const gameApi = async (action: string, body: any = {}) => {
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

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await gameApi('get_leaderboard', { telegram_id: user.telegram_id });
      setLeaderboard(data.leaderboard || []);
      setMyRank(data.my_rank);
      setNextReset(data.next_reset || null);
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplay = (u: any) => u?.username || u?.first_name || 'Player';

  const formatNextReset = () => {
    if (!nextReset) return '';
    const d = new Date(nextReset);
    const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
    if (days <= 0) return 'tez orada';
    if (days === 1) return 'ertaga';
    return `${days} kundan keyin`;
  };

  if (loading) {
    return (
      <div className="px-4 pt-2 pb-4 flex items-center justify-center min-h-[200px]">
        <div className="text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="px-4 pt-2 pb-4">
      <h2 className="font-display text-xl text-foreground mb-1 flex items-center gap-2">
        <Trophy className="text-accent" size={24} /> Top reyting
      </h2>
      <p className="text-xs text-muted-foreground mb-1">
        Haftalik referal bo'yicha • Top 20 ga 🪙 tangalar
      </p>
      <p className="text-[11px] text-primary font-bold mb-4">
        ⏰ Yangilanish: {formatNextReset()} (har dushanba 00:01 UZT)
      </p>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-2 mb-5">
          {podiumOrder.map((entry) => {
            if (!entry) return null;
            const isFirst = entry.rank === 1;
            const isMe = entry.user?.id === user.id;
            const size = isFirst ? 'w-20 h-20' : 'w-16 h-16';
            const avatarSize = isFirst ? 'w-14 h-14' : 'w-11 h-11';
            const podiumH = isFirst ? 'h-20' : entry.rank === 2 ? 'h-14' : 'h-10';
            const crownSize = isFirst ? 28 : 20;

            return (
              <div key={entry.rank} className="flex flex-col items-center">
                {/* Crown for #1 */}
                {isFirst && <Crown size={crownSize} className="text-yellow-400 mb-1" />}

                {/* Avatar */}
                <div className={`${avatarSize} rounded-full overflow-hidden flex-shrink-0 mb-1 ${
                  isFirst ? 'ring-2 ring-yellow-400' : entry.rank === 2 ? 'ring-2 ring-gray-300' : 'ring-2 ring-amber-600'
                }`}>
                  {entry.user?.photo_url ? (
                    <img src={entry.user.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <User size={isFirst ? 24 : 18} className="text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <p className={`text-xs font-bold truncate max-w-[80px] text-center ${isMe ? 'text-accent' : 'text-foreground'}`}>
                  {getUserDisplay(entry.user)}
                </p>

                {/* Referrals */}
                <p className="text-[10px] text-muted-foreground">{entry.referral_count} ref</p>

                {/* Podium block */}
                <div className={`${size} ${podiumH} mt-1 rounded-t-xl flex flex-col items-center justify-center ${
                  isFirst ? 'bg-yellow-400/20 border border-yellow-400/40' :
                  entry.rank === 2 ? 'bg-gray-300/20 border border-gray-300/40' :
                  'bg-amber-600/20 border border-amber-600/40'
                }`}>
                  <span className="font-display text-lg text-foreground">#{entry.rank}</span>
                  <span className="text-xs font-bold text-accent">{entry.reward_coins} 🪙</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest of leaderboard (#4-#20) */}
      <div className="flex flex-col gap-2">
        {rest.length === 0 && top3.length === 0 && (
          <div className="game-card text-center py-8">
            <p className="text-muted-foreground text-sm">Hozircha reyting bo'sh</p>
          </div>
        )}

        {rest.map((entry) => {
          const isMe = entry.user?.id === user.id;
          return (
            <div
              key={entry.rank}
              className={`game-card flex items-center gap-3 py-3 ${isMe ? 'ring-1 ring-accent' : ''}`}
            >
              <div className="w-8 text-center">
                <span className="text-sm font-bold text-muted-foreground">{entry.rank}</span>
              </div>

              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {entry.user?.photo_url ? (
                  <img src={entry.user.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className="text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm truncate ${isMe ? 'text-accent' : 'text-foreground'}`}>
                  {getUserDisplay(entry.user)} {isMe && '(Siz)'}
                </p>
                <p className="text-xs text-muted-foreground">{entry.referral_count} referal</p>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-sm font-bold text-accent">{entry.reward_coins} 🪙</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* My rank if not in top 20 */}
      {myRank && myRank > 20 && (
        <div className="game-card mt-3 flex items-center gap-3 py-3 ring-1 ring-accent">
          <div className="w-8 text-center">
            <span className="text-sm font-bold text-accent">{myRank}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.photo_url ? (
              <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-accent">{user.username} (Siz)</p>
            <p className="text-xs text-muted-foreground">#{myRank}-o'rin</p>
          </div>
        </div>
      )}

      {/* Rewards table */}
      <div className="game-card mt-4">
        <p className="text-xs font-bold text-foreground mb-2">Mukofotlar (🪙 Coin):</p>
        <div className="grid grid-cols-5 gap-1 text-[10px] text-muted-foreground">
          {REWARDS.map((r, i) => (
            <div key={i} className="flex justify-between px-1">
              <span>#{i + 1}</span>
              <span className="text-accent">{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RatingScreen;
