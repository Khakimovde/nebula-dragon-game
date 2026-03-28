import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { Star, Heart } from 'lucide-react';

const TopBar: React.FC = () => {
  const { user } = useGame();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 py-2 max-w-lg mx-auto">
        <div className="flex items-center gap-1">
          <Star className="text-star-gold star-glow" size={20} fill="currentColor" />
          <span className="font-display text-accent text-lg">{user.stars.toLocaleString()}</span>
        </div>
        <h1 className="font-display text-primary text-lg">STAR DRAGON</h1>
        <div className="flex items-center gap-1">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              size={18}
              className={i < user.lives ? 'text-heart-red heart-pulse' : 'text-muted-foreground'}
              fill={i < user.lives ? 'currentColor' : 'none'}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
