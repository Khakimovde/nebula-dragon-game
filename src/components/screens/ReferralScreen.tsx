import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { Copy, Users, Gift } from 'lucide-react';
import { toast } from 'sonner';

const ReferralScreen: React.FC = () => {
  const { user } = useGame();

  const referralLink = `https://t.me/Star_dragonbot?start=${user.referral_code}`;
  const channelLink = 'https://t.me/Star_Dragonn';

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Havola nusxalandi!');
  };

  const shareLink = () => {
    // Use Telegram share if available
    try {
      // @ts-expect-error Telegram WebApp
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Star Dragon o\'yiniga qo\'shiling va yulduzlar yig\'ing! 🐉⭐')}`);
        return;
      }
    } catch {}
    copyLink();
  };

  return (
    <div className="px-4 pt-2 pb-4">
      <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
        <Users className="text-neon-blue" size={24} /> Referal tizimi
      </h2>

      <div className="game-card mb-4 text-center">
        <Gift className="mx-auto text-accent mb-2" size={40} />
        <h3 className="font-display text-lg text-foreground">Do'stlaringizni taklif qiling!</h3>
        <p className="text-muted-foreground text-sm mt-1">Har bir do'st uchun <span className="text-accent font-bold">+100 ⭐</span></p>
        <p className="text-muted-foreground text-xs mt-1">Do'stingiz botga start bosishi va kanalga obuna bo'lishi kerak</p>
      </div>

      <div className="game-card mb-4">
        <p className="text-xs text-muted-foreground mb-2">Sizning referal havolangiz:</p>
        <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
          <span className="text-xs text-foreground truncate flex-1">{referralLink}</span>
          <button onClick={copyLink} className="text-primary">
            <Copy size={18} />
          </button>
        </div>
      </div>

      <button onClick={shareLink} className="btn-neon w-full mb-4">
        📤 Do'stga yuborish
      </button>

      <div className="game-card mb-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Jami referallar:</span>
          <span className="font-display text-xl text-neon-green">{user.referrals}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-muted-foreground text-sm">Yig'ilgan yulduzlar:</span>
          <span className="font-display text-xl text-accent">{user.referrals * 100} ⭐</span>
        </div>
      </div>

    </div>
  );
};

export default ReferralScreen;
