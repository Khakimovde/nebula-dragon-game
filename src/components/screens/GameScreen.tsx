import React, { useState, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import GameCanvas from '@/components/GameCanvas';
import AdComponent from '@/components/AdComponent';
import { Heart, Play } from 'lucide-react';

const GameScreen: React.FC = () => {
  const { user, loseLife, restoreLives } = useGame();
  const [gameOver, setGameOver] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [adsWatched, setAdsWatched] = useState(0);
  const [gameKey, setGameKey] = useState(0);

  const handleGameOver = useCallback((score: number) => {
    setLastScore(score);
    loseLife();
    setGameOver(true);
  }, [loseLife]);

  const handleRestart = () => {
    setGameOver(false);
    setGameKey(prev => prev + 1);
  };

  const handleAdReward = () => {
    const newCount = adsWatched + 1;
    setAdsWatched(newCount);
    // Ad only gives lives, NOT stars
    if (newCount >= 5) {
      restoreLives();
      setAdsWatched(0);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-2">
      {!gameOver ? (
        <GameCanvas key={gameKey} onGameOver={handleGameOver} />
      ) : (
        <div className="game-card flex flex-col items-center gap-4 w-full max-w-sm animate-[slideUp_0.3s_ease]">
          <h2 className="font-display text-2xl text-destructive">O'YIN TUGADI!</h2>
          <p className="text-foreground/80 font-body text-lg">Natija: <span className="text-accent font-bold">{lastScore}</span></p>

          <div className="flex items-center gap-1 mb-2">
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                size={24}
                className={i < user.lives ? 'text-heart-red' : 'text-muted-foreground'}
                fill={i < user.lives ? 'currentColor' : 'none'}
              />
            ))}
          </div>

          {user.lives > 0 ? (
            <button onClick={handleRestart} className="btn-neon flex items-center gap-2">
              <Play size={18} /> Davom etish
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              <p className="text-muted-foreground text-sm text-center">
                Jonlar tugadi! 5 ta reklama ko'ring va 3 ta jon oling
              </p>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${(adsWatched / 5) * 100}%`,
                    background: 'var(--gradient-neon)',
                  }}
                />
              </div>
              <p className="text-sm text-foreground/70">{adsWatched}/5 reklama</p>
              <AdComponent
                onReward={handleAdReward}
                className="btn-gold w-full watch-ad"
              >
                📺 Reklama ko'rish (jon olish uchun)
              </AdComponent>
              {user.lives > 0 && (
                <button onClick={handleRestart} className="btn-neon w-full flex items-center justify-center gap-2">
                  <Play size={18} /> Qayta o'ynash
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameScreen;
