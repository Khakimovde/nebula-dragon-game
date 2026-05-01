import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ open, onClose }) => {
  const { user, addWithdrawRequest } = useGame();
  const [cardType, setCardType] = useState<'uzcard' | 'humo'>('uzcard');
  const [cardNumber, setCardNumber] = useState('');
  const [coinsAmount, setCoinsAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  // Kurs: 6000 coin = 5000 so'm. So'mdagi miqdor = (coins / 6000) * 5000
  const numCoins = parseInt(coinsAmount) || 0;
  const sumAmount = Math.floor((numCoins / 6000) * 5000);

  const handleSubmit = () => {
    if (submitting) return;
    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16 || !/^\d+$/.test(cardNumber.replace(/\s/g, ''))) {
      toast.error('Karta raqami 16 ta raqam bo\'lishi kerak!');
      return;
    }
    if (!numCoins || numCoins < 6000) {
      toast.error('Minimal miqdor: 6,000 coin (5,000 so\'m)');
      return;
    }
    if (user.coins < numCoins) {
      toast.error('Yetarli coin yo\'q!');
      return;
    }

    setSubmitting(true);
    addWithdrawRequest({
      user_id: String(user.telegram_id),
      amount: numCoins,
      card_type: cardType,
      card_number: cardNumber.replace(/\s/g, ''),
      status: 'pending',
    });

    toast.success(`So'rov yuborildi! ${sumAmount.toLocaleString()} so'm 7 ish kuni ichida o'tkaziladi.`);
    setCardNumber('');
    setCoinsAmount('');
    setTimeout(() => { setSubmitting(false); onClose(); }, 500);
  };

  const formatCard = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-end justify-center">
      <div className="game-card w-full max-w-lg rounded-b-none animate-[slideUp_0.3s_ease] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-foreground">💵 Pul yechish</h3>
          <button onClick={onClose} className="text-muted-foreground"><X size={20} /></button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['uzcard', 'humo'] as const).map(type => (
            <button
              key={type}
              onClick={() => setCardType(type)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                cardType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mb-3">
          <label className="text-xs text-muted-foreground mb-1 block">Karta raqami</label>
          <input
            type="text"
            value={cardNumber}
            onChange={e => setCardNumber(formatCard(e.target.value))}
            placeholder="0000 0000 0000 0000"
            className="w-full bg-muted text-foreground rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary"
            maxLength={19}
          />
        </div>

        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1 block">Miqdor (so'm)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="10000"
            min={10000}
            className="w-full bg-muted text-foreground rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-[10px] text-muted-foreground mt-1">Minimal: 10,000 so'm · Balans: {user.coins.toLocaleString()} coin</p>
        </div>

        <button onClick={handleSubmit} className="btn-fire w-full">
          So'rov yuborish
        </button>
      </div>
    </div>
  );
};

export default WithdrawModal;
