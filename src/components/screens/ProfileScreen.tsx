import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { User, Star, Heart, Shield, CreditCard, ArrowRightLeft } from 'lucide-react';
import WithdrawModal from '@/components/WithdrawModal';

const ProfileScreen: React.FC = () => {
  const { user, convertStarsToCoins, withdrawRequests, isAdmin } = useGame();
  const [showWithdraw, setShowWithdraw] = useState(false);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    paid: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const statusLabels: Record<string, string> = {
    pending: "So'rov yuborildi",
    approved: "Tasdiqlandi",
    paid: "To'landi",
    rejected: "Rad etildi",
  };

  return (
    <div className="px-4 pt-2 pb-4">
      <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
        <User className="text-primary" size={24} /> Profil
      </h2>

      <div className="game-card mb-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
          {user.photo_url ? (
            <img src={user.photo_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">🐉</span>
          )}
        </div>
        <div>
          <h3 className="font-display text-lg text-foreground">{user.first_name || user.username}</h3>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
          <p className="text-xs text-muted-foreground">ID: {user.telegram_id}</p>
          {isAdmin && (
            <span className="inline-flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full mt-1">
              <Shield size={10} /> Admin
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="game-card text-center">
          <Star className="mx-auto text-star-gold star-glow mb-1" size={24} fill="currentColor" />
          <p className="font-display text-lg text-accent">{user.stars.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Yulduzlar</p>
        </div>
        <div className="game-card text-center">
          <span className="block mx-auto mb-1 text-2xl">🪙</span>
          <p className="font-display text-lg text-coin-orange">{user.coins.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Coinlar</p>
        </div>
        <div className="game-card text-center">
          <Heart className="mx-auto text-heart-red mb-1" size={24} fill="currentColor" />
          <p className="font-display text-lg text-heart-red">{user.lives}</p>
          <p className="text-xs text-muted-foreground">Jonlar</p>
        </div>
        <div className="game-card text-center">
          <User className="mx-auto text-neon-blue mb-1" size={24} />
          <p className="font-display text-lg text-neon-blue">{user.referrals}</p>
          <p className="text-xs text-muted-foreground">Referallar</p>
        </div>
      </div>

      {/* Stars → Coins conversion (7000⭐ = 5000🪙) */}
      <div className="game-card mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-foreground font-bold">Yulduzni coinga aylantirish</span>
          <ArrowRightLeft size={16} className="text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground mb-3">Kurs: 7,000 ⭐ = 5,000 🪙</p>
        <button
          onClick={() => convertStarsToCoins()}
          disabled={user.stars < 7000}
          className={user.stars >= 7000 ? 'btn-gold w-full' : 'w-full py-3 rounded-xl bg-muted text-muted-foreground font-bold cursor-not-allowed'}
        >
          Aylantirish (7,000⭐ → 5,000🪙)
        </button>
      </div>

      {/* Withdraw — minimal 6000 coin = 5000 so'm */}
      <div className="game-card mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-foreground font-bold flex items-center gap-2">
            <CreditCard size={16} /> Pul yechish
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-1">Kurs: 6,000 🪙 = 5,000 so'm</p>
        <p className="text-xs text-muted-foreground mb-3">Minimal: 6,000 coin (5,000 so'm)</p>
        <p className="text-xs text-destructive/80 mb-3">⚠️ To'lov 7 ish kuni ichida amalga oshiriladi</p>
        <button
          onClick={() => setShowWithdraw(true)}
          disabled={user.coins < 6000}
          className={user.coins >= 6000 ? 'btn-fire w-full' : 'w-full py-3 rounded-xl bg-muted text-muted-foreground font-bold cursor-not-allowed'}
        >
          💵 Pul yechish
        </button>
      </div>

      {/* Withdraw history */}
      {withdrawRequests.length > 0 && (
        <div className="game-card">
          <h4 className="font-bold text-sm text-foreground mb-3">So'rovlar tarixi</h4>
          <div className="flex flex-col gap-2">
            {withdrawRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                <div>
                  <p className="text-xs text-foreground font-bold">{req.amount.toLocaleString()} so'm</p>
                  <p className="text-[10px] text-muted-foreground">{req.card_type.toUpperCase()} •••• {req.card_number.slice(-4)}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[req.status]}`}>
                  {statusLabels[req.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <WithdrawModal open={showWithdraw} onClose={() => setShowWithdraw(false)} />
    </div>
  );
};

export default ProfileScreen;
