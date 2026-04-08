import React, { useEffect, useState, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Target, Ticket, Trophy, Clock, Users, User } from 'lucide-react';
import AdComponent from '@/components/AdComponent';
import { toast } from 'sonner';

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

const WheelScreen: React.FC = () => {
  const { user } = useGame();
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState<any>(null);
  const [nextRoundTime, setNextRoundTime] = useState<string>('');
  const [tickets, setTickets] = useState(0);
  const [adsWatched, setAdsWatched] = useState(0);
  const [participated, setParticipated] = useState(false);
  const [lastWinner, setLastWinner] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [adLoading, setAdLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const data = await gameApi('get_wheel_status', { telegram_id: user.telegram_id });
      setRound(data.round);
      setNextRoundTime(data.next_round_time);
      setTickets(data.tickets);
      setAdsWatched(data.ads_watched);
      setParticipated(data.participated);
      setLastWinner(data.last_winner);
    } catch (e) {
      console.error('Wheel status error:', e);
    } finally {
      setLoading(false);
    }
  }, [user.telegram_id]);

  useEffect(() => {
    if (user.telegram_id) loadStatus();
  }, [loadStatus, user.telegram_id]);

  useEffect(() => {
    if (!nextRoundTime) return;
    const interval = setInterval(() => {
      const diff = new Date(nextRoundTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        loadStatus();
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [nextRoundTime, loadStatus]);

  const handleWatchAd = async () => {
    if (adLoading) return;
    setAdLoading(true);
    try {
      const data = await gameApi('watch_wheel_ad', { telegram_id: user.telegram_id });
      setAdsWatched(data.ads_watched);
      setTickets(data.tickets_earned);
      if (data.ads_watched === 0) {
        toast.success('🎫 Chipta olindi!');
      } else {
        toast.success(`Reklama ko'rildi (${data.ads_watched}/10)`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Xatolik');
    } finally {
      setAdLoading(false);
    }
  };

  const handleJoin = async () => {
    if (joinLoading) return;
    setJoinLoading(true);
    try {
      await gameApi('join_wheel', { telegram_id: user.telegram_id });
      setParticipated(true);
      setTickets(prev => prev - 5);
      setRound((prev: any) => prev ? { ...prev, participant_count: prev.participant_count + 1 } : prev);
      toast.success("🎡 Raundga qo'shildingiz!");
    } catch (e: any) {
      toast.error(e.message || 'Xatolik');
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 pt-2 pb-4 flex items-center justify-center min-h-[200px]">
        <div className="text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  const isRoundActive = round?.status === 'active';
  const canJoin = isRoundActive && tickets >= 5 && !participated;

  return (
    <div className="px-4 pt-2 pb-4">
      <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
        <Target className="text-accent" size={24} /> Omad G'ildiragi
      </h2>

      {/* Timer & Round Info */}
      <div className="game-card mb-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock size={18} className="text-accent" />
          <span className="text-xs text-muted-foreground">Raund tugashiga:</span>
        </div>
        <div className="font-display text-3xl text-foreground mb-2">{timeLeft || '--:--:--'}</div>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users size={14} /> {round?.participant_count || 0} ishtirokchi
          </span>
          <span className="flex items-center gap-1">
            <Trophy size={14} className="text-accent" /> 5,500 ⭐
          </span>
        </div>
        {round?.round_time && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Raund vaqti: {new Date(round.round_time).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
          </p>
        )}
      </div>

      {/* Ticket Progress */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Ticket size={20} className="text-accent" />
          <span className="font-bold text-sm text-foreground">Chiptalaring</span>
          <span className="ml-auto font-display text-lg text-accent">{tickets}/5</span>
        </div>

        <div className="flex gap-1 mb-3">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${i < tickets ? 'bg-accent' : 'bg-muted'}`}
            />
          ))}
        </div>

        {isRoundActive && !participated && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Keyingi chipta uchun reklama:</span>
              <span className="text-xs font-bold text-foreground">{adsWatched}/10</span>
            </div>

            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i < adsWatched ? 'bg-primary' : 'bg-muted'}`}
                />
              ))}
            </div>

            <AdComponent
              onReward={handleWatchAd}
              className="btn-neon w-full text-sm py-2 watch-ad"
            >
              📺 Reklama ko'rish ({adsWatched}/10)
            </AdComponent>
          </>
        )}
      </div>

      {/* Join Button */}
      {isRoundActive && (
        <div className="mb-4">
          {participated ? (
            <button
              disabled
              className="w-full py-3 rounded-xl bg-primary/20 text-primary font-bold cursor-default text-sm"
            >
              ✅ Siz qatnashyapsiz! G'olibni kuting...
            </button>
          ) : canJoin ? (
            <button
              onClick={handleJoin}
              disabled={joinLoading}
              className="btn-gold w-full text-sm py-3"
            >
              {joinLoading ? '⏳ Yuklanmoqda...' : '🎡 Qatnashish (5 chipta)'}
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 rounded-xl bg-muted text-muted-foreground font-bold cursor-not-allowed text-sm"
            >
              🎫 {5 - tickets} ta chipta yetmaydi
            </button>
          )}
        </div>
      )}

      {/* How it works */}
      <div className="game-card mb-4">
        <p className="text-xs font-bold text-foreground mb-2">Qanday ishlaydi?</p>
        <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
          <p>🎫 10 ta reklama = 1 chipta</p>
          <p>🎟️ 5 ta chipta = qatnashish huquqi</p>
          <p>🎡 Har 2 soatda 1 ta g'olib aniqlanadi</p>
          <p>⭐ G'olib 5,500 yulduz oladi</p>
          <p>👤 Har bir raundda 1 marta qatnashish mumkin</p>
          <p>🕐 Raundlar: 00:00, 02:00, 04:00, ... 22:00 (UZB vaqti)</p>
        </div>
      </div>

      {/* Last Winner */}
      {lastWinner && (
        <div className="game-card">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={20} className="text-yellow-400" />
            <span className="font-bold text-sm text-foreground">Oxirgi g'olib</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-yellow-400">
              {lastWinner.photo_url ? (
                <img src={lastWinner.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={28} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground text-base">
                {lastWinner.username || 'Player'}
              </p>
              <p className="text-sm text-accent font-bold">
                +{lastWinner.reward_stars?.toLocaleString()} ⭐ yutdi!
              </p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(lastWinner.round_time).toLocaleString('uz-UZ', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WheelScreen;
