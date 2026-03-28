import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import starImg from '@/assets/star.png';
import gameBg from '@/assets/game-bg.jpg';
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

// Star spawn chance per skin tier
const SKIN_STAR_CHANCE: Record<string, number> = {
  green: 0.4,
  fire: 0.5,
  ice: 0.55,
  gold: 0.65,
  neon: 0.75,
  diamond: 0.85,
};

interface Star {
  x: number;
  y: number;
  collected: boolean;
}

interface PipeObstacle {
  x: number;
  topY: number;
  bottomY: number;
  gap: number;
  passed: boolean;
  width: number;
}

const GRAVITY = 0.25;
const LIFT = -6;
const OBSTACLE_SPEED = 2.5;
const STAR_SIZE = 30;
const DRAGON_SIZE = 80;
const PIPE_WIDTH = 60;

// Space-themed pipe colors
const PIPE_GRADIENT_COLORS = {
  outer: '#2a1a4e',
  inner: '#4a2d8a',
  highlight: '#7c5cbf',
  edge: '#6b3fa0',
  cap: '#8b5cf6',
};

const GameCanvas: React.FC<{ onGameOver: (score: number) => void }> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addStars, user } = useGame();
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showStart, setShowStart] = useState(true);

  const gameRef = useRef({
    playerY: 200,
    velocity: 0,
    pipes: [] as PipeObstacle[],
    stars: [] as Star[],
    frameCount: 0,
    score: 0,
    bgX: 0,
    isRunning: false,
    dragonImage: null as HTMLImageElement | null,
    starImage: null as HTMLImageElement | null,
    bgImage: null as HTMLImageElement | null,
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
  }, [user.current_skin]);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.playerY = 200;
    g.velocity = 0;
    g.pipes = [];
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

  // Draw a space-themed pipe
  const drawPipe = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, isTop: boolean) => {
    if (height <= 0) return;

    // Main pipe body - space crystal gradient
    const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
    gradient.addColorStop(0, PIPE_GRADIENT_COLORS.outer);
    gradient.addColorStop(0.3, PIPE_GRADIENT_COLORS.inner);
    gradient.addColorStop(0.5, PIPE_GRADIENT_COLORS.highlight);
    gradient.addColorStop(0.7, PIPE_GRADIENT_COLORS.inner);
    gradient.addColorStop(1, PIPE_GRADIENT_COLORS.outer);

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    // Pipe edge lines
    ctx.strokeStyle = PIPE_GRADIENT_COLORS.edge;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Glowing center line
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2, y + height);
    ctx.stroke();

    // Cap at the opening end
    const capHeight = 12;
    const capWidth = width + 16;
    const capX = x - 8;
    const capY = isTop ? y + height - capHeight : y;

    const capGradient = ctx.createLinearGradient(capX, 0, capX + capWidth, 0);
    capGradient.addColorStop(0, PIPE_GRADIENT_COLORS.edge);
    capGradient.addColorStop(0.5, PIPE_GRADIENT_COLORS.cap);
    capGradient.addColorStop(1, PIPE_GRADIENT_COLORS.edge);

    ctx.fillStyle = capGradient;
    ctx.beginPath();
    ctx.roundRect(capX, capY, capWidth, capHeight, 4);
    ctx.fill();

    ctx.strokeStyle = PIPE_GRADIENT_COLORS.edge;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Small decorative dots (space debris effect)
    ctx.fillStyle = 'rgba(167, 139, 250, 0.3)';
    for (let i = 0; i < 3; i++) {
      const dotY = y + (height / 4) * (i + 0.5);
      if (dotY > y && dotY < y + height) {
        ctx.beginPath();
        ctx.arc(x + width * 0.25, dotY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + width * 0.75, dotY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const PLAYER_X = 80;

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
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, W, H);
      }

      if (!g.isRunning) {
        if (g.dragonImage) {
          const floatY = Math.sin(Date.now() / 500) * 10;
          ctx.save();
          ctx.translate(W / 2, H / 2 + floatY);
          ctx.drawImage(g.dragonImage, -40, -40, 80, 80);
          ctx.restore();
        }
        animId = requestAnimationFrame(loop);
        return;
      }

      // Physics
      g.velocity += GRAVITY;
      g.velocity = Math.min(g.velocity, 6);
      g.playerY += g.velocity;
      g.frameCount++;

      // Spawn pipe obstacles
      if (g.frameCount % 120 === 0) {
        const minGap = 140;
        const maxGap = 180;
        const gap = minGap + Math.random() * (maxGap - minGap);
        const gapCenter = 120 + Math.random() * (H - 240);
        const topY = gapCenter - gap / 2;

        g.pipes.push({
          x: W,
          topY,
          bottomY: gapCenter + gap / 2,
          gap,
          passed: false,
          width: PIPE_WIDTH,
        });

        // Stars in gap - always 1 star max
        const skinName = g.currentSkin;
        const starChance = SKIN_STAR_CHANCE[skinName] || 0.4;

        if (Math.random() < starChance) {
          g.stars.push({
            x: W + PIPE_WIDTH / 2,
            y: gapCenter,
            collected: false,
          });
        }
      }

      // Draw & update pipes
      g.pipes.forEach(pipe => {
        pipe.x -= OBSTACLE_SPEED;

        // Top pipe (from 0 to topY)
        drawPipe(ctx, pipe.x, 0, pipe.width, pipe.topY, true);

        // Bottom pipe (from bottomY to H)
        drawPipe(ctx, pipe.x, pipe.bottomY, pipe.width, H - pipe.bottomY, false);

        // Score
        if (!pipe.passed && pipe.x + pipe.width < PLAYER_X) {
          pipe.passed = true;
          g.score++;
          setScore(g.score);
        }
      });

      // Draw stars
      g.stars.forEach(star => {
        if (star.collected) return;
        star.x -= OBSTACLE_SPEED;

        if (g.starImage) {
          ctx.save();
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 10;
          ctx.drawImage(g.starImage, star.x - STAR_SIZE / 2, star.y - STAR_SIZE / 2, STAR_SIZE, STAR_SIZE);
          ctx.restore();
        } else {
          ctx.fillStyle = '#ffaa00';
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
          addStars(1); // Always 1 star
        }
      });

      // Draw dragon
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

      // Pipe collision
      for (const pipe of g.pipes) {
        const margin = 10;
        // Top pipe
        if (
          pCx + pR > pipe.x + margin && pCx - pR < pipe.x + pipe.width - margin &&
          pCy - pR < pipe.topY - margin
        ) {
          g.isRunning = false;
          setIsPlaying(false);
          onGameOver(g.score);
          animId = requestAnimationFrame(loop);
          return;
        }
        // Bottom pipe
        if (
          pCx + pR > pipe.x + margin && pCx - pR < pipe.x + pipe.width - margin &&
          pCy + pR > pipe.bottomY + margin
        ) {
          g.isRunning = false;
          setIsPlaying(false);
          onGameOver(g.score);
          animId = requestAnimationFrame(loop);
          return;
        }
      }

      // Cleanup
      g.pipes = g.pipes.filter(p => p.x > -100);
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
