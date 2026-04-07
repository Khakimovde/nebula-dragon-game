import React, { useEffect, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Trophy, Medal, Crown, User } from 'lucide-react';

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
  const [lastWeek, setLastWeek] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLastWeek, setShowLastWeek] = useState(false);

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
      setLastWeek(data.last_week || []);
      setMyRank(data.my_rank);
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={20} className="text-yellow-400" />;
    if (rank === 2) return <Medal size={20} className="text-gray-300" />;
    if (rank === 3) return <Medal size={20} className="text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
  };

  const getUserDisplay = (u: any) => {
    return u?.username || u?.first_name || 'Player';
  };

  if (loading) {
    return (
      <div className="px-4 pt-2 pb-4 flex items-center justify-center min-h-[200px]">
        <div className="text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  const displayData = showLastWeek ? lastWeek : leaderboard;

  return (
    <div className="px-4 pt-2 pb-4">
      <h2 className="font-display text-xl text-foreground mb-2 flex items-center gap-2">
        <Trophy className="text-accent" size={24} /> Haftalik reyting
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        Har dushanba 00:01 da yangilanadi • Jami mukofot: <span className="text-accent font-bold">10,500 🪙</span>
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowLastWeek(false)}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            !showLastWeek ? 'btn-neon' : 'bg-muted text-muted-foreground'
          }`}
        >
          Bu hafta
        </button>
        <button
          onClick={() => setShowLastWeek(true)}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            showLastWeek ? 'btn-neon' : 'bg-muted text-muted-foreground'
          }`}
        >
          O'tgan hafta
        </button>
      </div>

      {/* Leaderboard list */}
      <div className="flex flex-col gap-2">
        {displayData.length === 0 ? (
          <div className="game-card text-center py-8">
            <p className="text-muted-foreground text-sm">
              {showLastWeek ? "O'tgan hafta natijalari yo'q" : 'Hozircha reyting bo\'sh'}
            </p>
          </div>
        ) : (
          displayData.map((entry: any, i: number) => {
            const rank = showLastWeek ? entry.rank : entry.rank;
            const refCount = showLastWeek ? entry.referral_count : entry.referral_count;
            const reward = showLastWeek ? entry.reward_coins : REWARDS[i] || 50;
            const u = showLastWeek ? entry.user : entry.user;
            const isMe = u?.id === user.id;

            return (
              <div
                key={i}
                className={`game-card flex items-center gap-3 py-3 ${
                  isMe ? 'ring-1 ring-accent' : ''
                } ${rank <= 3 ? 'border-accent/30' : ''}`}
              >
                <div className="w-8 flex justify-center">
                  {getRankIcon(rank)}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {u?.photo_url ? (
                    <img src={u.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} className="text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${isMe ? 'text-accent' : 'text-foreground'}`}>
                    {getUserDisplay(u)} {isMe && '(Siz)'}
                  </p>
                  <p className="text-xs text-muted-foreground">{refCount} referal</p>
                </div>

                {/* Reward */}
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-bold text-accent">{reward} 🪙</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* My rank if not in top 20 */}
      {!showLastWeek && myRank && myRank > 20 && (
        <div className="game-card mt-3 flex items-center gap-3 py-3 ring-1 ring-accent">
          <div className="w-8 text-center">
            <span className="text-sm font-bold text-accent">{myRank}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
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

      {/* Rewards info */}
      {!showLastWeek && (
        <div className="game-card mt-4">
          <p className="text-xs font-bold text-foreground mb-2">Mukofotlar (🪙 Coin):</p>
          <div className="grid grid-cols-4 gap-1 text-[10px] text-muted-foreground">
            {REWARDS.map((r, i) => (
              <div key={i} className="flex justify-between">
                <span>#{i + 1}</span>
                <span className="text-accent">{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingScreen;
