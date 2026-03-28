import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import starImg from '@/assets/star.png';
import gameBg from '@/assets/game-bg.jpg';
import cloudImg from '@/assets/cloud.png';
import asteroidImg from '@/assets/asteroid.png';
import skinGreen from '@/assets/skin-green.png';
import skinFire from '@/assets/skin-fire.png';
import skinIce from '@/assets/skin-ice.png';
import skinGold from '@/assets/skin-gold.png';
import skinNeon from '@/assets/skin-neon.png';
import skinDiamond from '@/assets/skin-diamond.png';

const SKIN_IMAGES: Record<string, string> = {
  green: skinGreen,
  fire: skinFire,
  ice: skinIce,
  gold: skinGold,
  neon: skinNeon,
  diamond: skinDiamond,
};

// Star spawn chance per skin tier (higher tier = more stars)
const SKIN_STAR_CHANCE: Record<string, number> = {
  green: 0.4,
  fire: 0.5,
  ice: 0.55,
  gold: 0.65,
  neon: 0.75,
  diamond: 0.85,
};

// Extra stars per cloud pair based on skin
const SKIN_EXTRA_STARS: Record<string, number> = {
  green: 0,
  fire: 0,
  ice: 0,
  gold: 1,
  neon: 1,
  diamond: 2,
};

interface Star {
  x: number;
  y: number;
  type: 'normal' | 'gold' | 'diamond';
  collected: boolean;
}

interface CloudObstacle {
  x: number;
  topY: number;
  bottomY: number;
  gap: number;
  passed: boolean;
  topSize: number;
  bottomSize: number;
}

interface Asteroid {
  x: number;
  y: number;
  speed: number;
  size: number;
  rotation: number;
  rotSpeed: number;
}

// Rocks removed — only clouds and asteroids kill

const GRAVITY = 0.25; // Slower fall
const LIFT = -6;
const OBSTACLE_SPEED = 2.5;
const STAR_SIZE = 30;
const DRAGON_SIZE = 80; // Bigger dragon
const CLOUD_WIDTH = 180; // Much bigger clouds
const CLOUD_HEIGHT = 160; // Taller clouds to cover top/bottom

const GameCanvas: React.FC<{ onGameOver: (score: number) => void }> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addStars, user } = useGame();
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showStart, setShowStart] = useState(true);

  const gameRef = useRef({
    playerY: 200,
    velocity: 0,
    clouds: [] as CloudObstacle[],
    asteroids: [] as Asteroid[],
    stars: [] as Star[],
    
    frameCount: 0,
    score: 0,
    bgX: 0,
    isRunning: false,
    dragonImage: null as HTMLImageElement | null,
    starImage: null as HTMLImageElement | null,
    bgImage: null as HTMLImageElement | null,
    cloudImage: null as HTMLImageElement | null,
    asteroidImage: null as HTMLImageElement | null,
    currentSkin: 'green',
  });

  useEffect(() => {
    const skinSrc = SKIN_IMAGES[user.current_skin] || skinGreen;
    const dragon = new Image();
    dragon.src = skinSrc;
    dragon.onload = () => { gameRef.current.dragonImage = dragon; };
    gameRef.current.currentSkin = user.current_skin;

    const star = new Image();
    star.src = starImg;
    star.onload = () => { gameRef.current.starImage = star; };

    const bg = new Image();
    bg.src = gameBg;
    bg.onload = () => { gameRef.current.bgImage = bg; };

    const cloud = new Image();
    cloud.src = cloudImg;
    cloud.onload = () => { gameRef.current.cloudImage = cloud; };

    const asteroid = new Image();
    asteroid.src = asteroidImg;
    asteroid.onload = () => { gameRef.current.asteroidImage = asteroid; };
  }, [user.current_skin]);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.playerY = 200;
    g.velocity = 0;
    g.clouds = [];
    g.asteroids = [];
    g.stars = [];
    
    g.frameCount = 0;
    g.score = 0;
    g.isRunning = true;
    setScore(0);
    setIsPlaying(true);
    setShowStart(false);
  }, []);

  const fly = useCallback(() => {
    if (showStart) {
      startGame();
      return;
    }
    if (gameRef.current.isRunning) {
      gameRef.current.velocity = LIFT;
    }
  }, [showStart, startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const PLAYER_X = 80; // Dragon on the left side, facing left toward obstacles

    let animId: number;

    const loop = () => {
      const g = gameRef.current;

      // Draw background
      if (g.bgImage) {
        const imgW = g.bgImage.naturalWidth;
        const imgH = g.bgImage.naturalHeight;
        const scale = Math.max(W / imgW, H / imgH);
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const offsetX = (W - drawW) / 2;
        const offsetY = (H - drawH) / 2;

        g.bgX -= 0.5;
        if (g.bgX <= -drawW) g.bgX = 0;

        ctx.drawImage(g.bgImage, g.bgX + offsetX, offsetY, drawW, drawH);
        ctx.drawImage(g.bgImage, g.bgX + drawW + offsetX, offsetY, drawW, drawH);
      } else {
        ctx.fillStyle = '#1a1030';
        ctx.fillRect(0, 0, W, H);
      }

      if (!g.isRunning) {
        if (g.dragonImage) {
          const floatY = Math.sin(Date.now() / 500) * 10;
          // Dragon faces LEFT — flip horizontally
          ctx.save();
          ctx.translate(W / 2, H / 2 + floatY);
          ctx.drawImage(g.dragonImage, -40, -40, 80, 80);
          ctx.restore();
        }
        animId = requestAnimationFrame(loop);
        return;
      }

      // Physics — smoother fall
      g.velocity += GRAVITY;
      g.velocity = Math.min(g.velocity, 6); // Cap max fall speed
      g.playerY += g.velocity;
      g.frameCount++;

      // Spawn cloud pairs — big clouds covering top and bottom, gap in middle
      if (g.frameCount % 120 === 0) {
        const minGap = 140;
        const maxGap = 180;
        const gap = minGap + Math.random() * (maxGap - minGap);
        // Gap center position
        const gapCenter = 120 + Math.random() * (H - 240);
        const topY = gapCenter - gap / 2;
        const cloudW = CLOUD_WIDTH + Math.random() * 40;

        g.clouds.push({
          x: W,
          topY,
          bottomY: gapCenter + gap / 2,
          gap,
          passed: false,
          topSize: cloudW,
          bottomSize: cloudW + Math.random() * 20 - 10,
        });

        // Stars in gap based on skin tier
        const skinName = g.currentSkin;
        const starChance = SKIN_STAR_CHANCE[skinName] || 0.4;
        const extraStars = SKIN_EXTRA_STARS[skinName] || 0;

        if (Math.random() < starChance) {
          const types: Star['type'][] = ['normal', 'normal', 'normal', 'gold', 'diamond'];
          g.stars.push({
            x: W + cloudW / 2,
            y: gapCenter,
            type: types[Math.floor(Math.random() * types.length)],
            collected: false,
          });
        }

        // Extra stars for higher tier skins
        for (let i = 0; i < extraStars; i++) {
          if (Math.random() < 0.5) {
            g.stars.push({
              x: W + cloudW / 2 + (i + 1) * 25,
              y: gapCenter + (Math.random() - 0.5) * (gap * 0.5),
              type: Math.random() > 0.7 ? 'gold' : 'normal',
              collected: false,
            });
          }
        }

      }

      // Spawn asteroids (meteors)
      if (g.frameCount % 70 === 0 && Math.random() > 0.4) {
        const size = 30 + Math.random() * 25;
        g.asteroids.push({
          x: W + size,
          y: 30 + Math.random() * (H - 60),
          speed: 3 + Math.random() * 2,
          size,
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 0.1,
        });
      }

      // Draw & update clouds — BIG, covering top and bottom fully
      g.clouds.forEach(cloud => {
        cloud.x -= OBSTACLE_SPEED;

        if (g.cloudImage) {
          // Top cloud — draw from very top down to topY
          const topCloudH = cloud.topY;
          // Draw multiple overlapping clouds to fill the top area
          ctx.drawImage(g.cloudImage, cloud.x - 20, -10, cloud.topSize + 40, topCloudH + 20);

          // Bottom cloud — draw from bottomY to very bottom
          const bottomCloudH = H - cloud.bottomY;
          ctx.drawImage(g.cloudImage, cloud.x - 20, cloud.bottomY - 10, cloud.bottomSize + 40, bottomCloudH + 20);
        } else {
          ctx.fillStyle = '#dde8f0';
          ctx.fillRect(cloud.x, 0, cloud.topSize, cloud.topY);
          ctx.fillRect(cloud.x, cloud.bottomY, cloud.bottomSize, H - cloud.bottomY);
        }

        // Score
        if (!cloud.passed && cloud.x + Math.max(cloud.topSize, cloud.bottomSize) < PLAYER_X) {
          cloud.passed = true;
          g.score++;
          setScore(g.score);
        }
      });


      // Draw & update asteroids
      g.asteroids.forEach(ast => {
        ast.x -= ast.speed;
        ast.rotation += ast.rotSpeed;

        if (g.asteroidImage) {
          ctx.save();
          ctx.translate(ast.x, ast.y);
          ctx.rotate(ast.rotation);
          ctx.drawImage(g.asteroidImage, -ast.size / 2, -ast.size / 2, ast.size, ast.size);
          ctx.restore();
        } else {
          ctx.fillStyle = '#8B4513';
          ctx.beginPath();
          ctx.arc(ast.x, ast.y, ast.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw stars
      g.stars.forEach(star => {
        if (star.collected) return;
        star.x -= OBSTACLE_SPEED;

        if (g.starImage) {
          ctx.save();
          if (star.type === 'gold') {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
          } else if (star.type === 'diamond') {
            ctx.shadowColor = '#00bfff';
            ctx.shadowBlur = 20;
          }
          ctx.drawImage(g.starImage, star.x - STAR_SIZE / 2, star.y - STAR_SIZE / 2, STAR_SIZE, STAR_SIZE);
          ctx.restore();
        } else {
          ctx.fillStyle = star.type === 'diamond' ? '#00bfff' : star.type === 'gold' ? '#ffd700' : '#ffaa00';
          ctx.beginPath();
          ctx.arc(star.x, star.y, 12, 0, Math.PI * 2);
          ctx.fill();
        }

        // Star collision
        const cx = PLAYER_X + DRAGON_SIZE / 2;
        const cy = g.playerY + DRAGON_SIZE / 2;
        const dx = star.x - cx;
        const dy = star.y - cy;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
          star.collected = true;
          const amounts = { normal: 1, gold: 3, diamond: 5 };
          addStars(amounts[star.type]);
        }
      });

      // Draw dragon — facing LEFT (flip horizontally)
      if (g.dragonImage) {
        ctx.save();
        const cx = PLAYER_X + DRAGON_SIZE / 2;
        const cy = g.playerY + DRAGON_SIZE / 2;
        ctx.translate(cx, cy);
        const angle = Math.min(Math.max(g.velocity * 3, -25), 25) * Math.PI / 180;
        ctx.rotate(angle);
        ctx.drawImage(g.dragonImage, -DRAGON_SIZE / 2, -DRAGON_SIZE / 2, DRAGON_SIZE, DRAGON_SIZE);
        ctx.restore();
      } else {
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(PLAYER_X, g.playerY, DRAGON_SIZE, DRAGON_SIZE);
      }

      // Collision detection
      const pCx = PLAYER_X + DRAGON_SIZE / 2;
      const pCy = g.playerY + DRAGON_SIZE / 2;
      const pR = DRAGON_SIZE / 2 - 10;

      // Floor/ceiling
      if (g.playerY < 0 || g.playerY + DRAGON_SIZE > H) {
        g.isRunning = false;
        setIsPlaying(false);
        onGameOver(g.score);
        animId = requestAnimationFrame(loop);
        return;
      }

      // Cloud collision — only actual visible cloud areas
      for (const cloud of g.clouds) {
        const margin = 15; // Forgiving collision margin
        // Top cloud area (0 to topY)
        if (
          pCx + pR > cloud.x + margin && pCx - pR < cloud.x + cloud.topSize - margin &&
          pCy - pR < cloud.topY - margin
        ) {
          g.isRunning = false;
          setIsPlaying(false);
          onGameOver(g.score);
          animId = requestAnimationFrame(loop);
          return;
        }
        // Bottom cloud area (bottomY to H)
        if (
          pCx + pR > cloud.x + margin && pCx - pR < cloud.x + cloud.bottomSize - margin &&
          pCy + pR > cloud.bottomY + margin
        ) {
          g.isRunning = false;
          setIsPlaying(false);
          onGameOver(g.score);
          animId = requestAnimationFrame(loop);
          return;
        }
      }


      // Asteroid collision
      for (const ast of g.asteroids) {
        const dx = ast.x - pCx;
        const dy = ast.y - pCy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < pR + ast.size / 2 - 5) {
          g.isRunning = false;
          setIsPlaying(false);
          onGameOver(g.score);
          animId = requestAnimationFrame(loop);
          return;
        }
      }

      // Cleanup
      g.clouds = g.clouds.filter(c => c.x > -250);
      g.asteroids = g.asteroids.filter(a => a.x > -60);
      g.stars = g.stars.filter(s => s.x > -50 && !s.collected);
      

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [addStars, onGameOver, isPlaying]);

  return (
    <div className="relative w-full" style={{ aspectRatio: '9/16', maxHeight: '100%' }}>
      <canvas
        ref={canvasRef}
        width={390}
        height={600}
        className="w-full h-full rounded-2xl touch-none"
        onPointerDown={fly}
        style={{ touchAction: 'none' }}
      />
      {showStart && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 rounded-2xl">
          <h2 className="text-3xl font-display text-accent mb-4 glow-text">STAR DRAGON</h2>
          <p className="text-foreground/70 mb-6 font-body">Bosib o'ynang!</p>
          <button onClick={startGame} className="btn-neon text-lg">▶ O'YNASH</button>
        </div>
      )}
      {isPlaying && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <span className="text-4xl font-display text-foreground drop-shadow-lg">{score}</span>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;