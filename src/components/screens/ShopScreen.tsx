import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { Check, Lock, Palette, Star } from 'lucide-react';
import skinGreen from '@/assets/skin-green.png';
import skinFire from '@/assets/skin-fire.png';
import skinIce from '@/assets/skin-ice.png';
import skinGold from '@/assets/skin-gold.png';
import skinNeon from '@/assets/skin-neon.png';
import skinDiamond from '@/assets/skin-diamond.png';

const skins = [
  { name: 'green', label: 'Yashil Dragon', price: 0, color: '#4ade80', image: skinGreen, starMultiplier: 1, bonusLives: 3 },
  { name: 'fire', label: 'Olov Dragon', price: 5000, color: '#ef4444', image: skinFire, starMultiplier: 1, bonusLives: 3 },
  { name: 'ice', label: 'Muz Dragon', price: 10000, color: '#38bdf8', image: skinIce, starMultiplier: 2, bonusLives: 3 },
  { name: 'gold', label: 'Oltin Dragon', price: 15000, color: '#f59e0b', image: skinGold, starMultiplier: 3, bonusLives: 3 },
  { name: 'neon', label: 'Neon Dragon', price: 20000, color: '#a855f7', image: skinNeon, starMultiplier: 4, bonusLives: 4 },
  { name: 'diamond', label: 'Olmosh Dragon', price: 30000, color: '#06b6d4', image: skinDiamond, starMultiplier: 4, bonusLives: 5 },
];

const ShopScreen: React.FC = () => {
  const { user, buySkin, selectSkin } = useGame();

  return (
    <div className="px-4 pt-2 pb-4">
      <h2 className="font-display text-xl text-foreground mb-2 flex items-center gap-2">
        <Palette className="text-secondary" size={24} /> Do'kon
      </h2>
      <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
        <Star size={12} className="text-accent" /> Qimmat ajdarho = ko'proq yulduz yig'adi!
      </p>
      <div className="grid grid-cols-2 gap-3">
        {skins.map(skin => {
          const owned = user.skins.includes(skin.name);
          const active = user.current_skin === skin.name;

          return (
            <div key={skin.name} className={`game-card flex flex-col items-center gap-2 ${active ? 'ring-2 ring-primary' : ''}`}>
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ background: `${skin.color}20`, boxShadow: `0 0 20px ${skin.color}40` }}
              >
                <img src={skin.image} alt={skin.label} className="w-16 h-16 object-contain" />
              </div>
              <span className="font-bold text-sm text-foreground">{skin.label}</span>
              <span className="text-[10px] text-accent font-bold">⭐ x{skin.starMultiplier} yulduz</span>
              {skin.bonusLives > 3 && (
                <span className="text-[10px] text-heart-red font-bold">❤️ {skin.bonusLives} ta jon</span>
              )}
              {!owned ? (
                <button
                  onClick={() => buySkin(skin.name, skin.price)}
                  disabled={user.stars < skin.price}
                  className={`w-full text-xs py-2 rounded-lg font-bold transition-all ${
                    user.stars >= skin.price ? 'btn-gold' : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {user.stars >= skin.price ? `⭐ ${skin.price.toLocaleString()}` : <><Lock size={12} className="inline" /> {skin.price.toLocaleString()}</>}
                </button>
              ) : active ? (
                <span className="text-primary text-xs font-bold flex items-center gap-1">
                  <Check size={14} /> Tanlangan
                </span>
              ) : (
                <button onClick={() => selectSkin(skin.name)} className="btn-neon w-full text-xs py-2">
                  Tanlash
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShopScreen;
