import { useEffect, useRef, useState } from "react";
import { useWindowSize, useKey } from "react-use";

// Types for Game Logic
interface Point { x: number; y: number; }
interface Entity extends Point { width: number; height: number; vx: number; vy: number; color: string; hp: number; maxHp: number; }

interface Collectible extends Point { width: number; height: number; collected: boolean; color: string; }

interface GameState {
  player: Entity;
  platforms: Entity[];
  enemies: Entity[];
  projectiles: Entity[];
  particles: Particle[];
  score: number;
  coins: number;
  time: number;
  difficulty: number;
  isGameOver: boolean;
  cameraX: number;
  level: number;
  collectibles: Collectible[];
  portal: Entity | null;
}

interface Particle extends Point { vx: number; vy: number; life: number; color: string; size: number; }

interface GameCanvasProps {
  characterId: string;
  onGameOver: (stats: { score: number; duration: number; coins: number }) => void;
  onCoinCollect?: (amount: number) => void;
  isPaused: boolean;
}

const GRAVITY = 0.5;
const FRICTION = 0.8;
const MOVE_SPEED = 5;
const JUMP_FORCE = -12;

export function GameCanvas({ characterId, onGameOver, onCoinCollect, isPaused }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = useWindowSize();
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  // Input State
  const keys = useRef<Set<string>>(new Set());

  // Game State
  const gameState = useRef<GameState>({
    player: { x: 100, y: 100, width: 32, height: 48, vx: 0, vy: 0, color: '#06b6d4', hp: 100, maxHp: 100 },
    platforms: [],
    enemies: [],
    projectiles: [],
    particles: [],
    score: 0,
    coins: 0,
    time: 0,
    difficulty: 1,
    isGameOver: false,
    cameraX: 0,
    level: 1,
    collectibles: [],
    portal: null,
  });

  const MAP_WIDTH = width * 5;

  // Handle Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keys.current.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Initial Level Generation
    generateLevel(width, height);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Resize handler
  useEffect(() => {
    generateLevel(width, height);
  }, [width, height]);

  const generateLevel = (w: number, h: number) => {
    const groundHeight = 50;
    const platforms: Entity[] = [];
    
    // Extended floor
    platforms.push({ x: 0, y: h - groundHeight, width: MAP_WIDTH, height: groundHeight, vx: 0, vy: 0, color: '#334155', hp: 9999, maxHp: 9999 });

    // Generate layers
    const layerCount = 5;
    const layerSpacing = 150;
    
    for (let l = 0; l < layerCount; l++) {
      const layerY = h - 200 - (l * layerSpacing);
      let x = 0;
      while (x < MAP_WIDTH) {
        const platWidth = 200 + Math.random() * 400;
        const gap = 100 + Math.random() * 200;
        
        platforms.push({
          x,
          y: layerY,
          width: platWidth,
          height: 20,
          vx: 0, vy: 0, color: '#475569', hp: 9999, maxHp: 9999
        });
        
        x += platWidth + gap;
      }
    }

    gameState.current.platforms = platforms;
    
    // Hidden collectibles
    const collectibles: Collectible[] = [];
    for (let i = 0; i < 5; i++) {
      // Pick a random platform (not the floor)
      const platIndex = 1 + Math.floor(Math.random() * (platforms.length - 1));
      const plat = platforms[platIndex];
      collectibles.push({
        x: plat.x + Math.random() * (plat.width - 20),
        y: plat.y - 20,
        width: 20,
        height: 20,
        collected: false,
        color: '#fbbf24' // gold
      });
    }
    gameState.current.collectibles = collectibles;
    gameState.current.portal = null;

    // Reset player position
    gameState.current.player.x = 100;
    gameState.current.player.y = h - 150;
  };

  const spawnEnemy = (w: number, h: number, difficulty: number) => {
    // Determine enemy type based on difficulty and chance
    const isBoss = Math.random() < 0.05 * difficulty; // 5% chance scales with diff
    const size = isBoss ? 64 : 32;
    const hp = isBoss ? 200 * difficulty : 20 * difficulty;
    const color = isBoss ? '#9333ea' : '#ef4444'; // Boss = Purple, Enemy = Red
    
    // Spawn near player but off-screen
    const spawnDistance = width / 2 + 100;
    const side = Math.random() > 0.5 ? 1 : -1;
    const x = gameState.current.player.x + (side * spawnDistance);
    
    gameState.current.enemies.push({
      x,
      y: h - 150,
      width: size,
      height: size,
      vx: 0,
      vy: 0,
      color,
      hp,
      maxHp: hp,
    });
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      gameState.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color,
        size: Math.random() * 4 + 2
      });
    }
  };

  const update = (dt: number) => {
    if (isPaused || gameState.current.isGameOver) return;
    const state = gameState.current;
    
    state.time += dt;
    // Difficulty increases every 30 seconds
    state.difficulty = 1 + Math.floor(state.time / 30000) * 0.5;

    // --- Player Movement ---
    if (keys.current.has('KeyA') || keys.current.has('ArrowLeft')) state.player.vx -= 1;
    if (keys.current.has('KeyD') || keys.current.has('ArrowRight')) state.player.vx += 1;
    
    // Jump
    if ((keys.current.has('Space') || keys.current.has('ArrowUp')) && state.player.vy === 0) {
      state.player.vy = JUMP_FORCE;
    }

    // Apply Physics to Player
    state.player.vx *= FRICTION;
    state.player.vy += GRAVITY;
    state.player.x += state.player.vx;
    state.player.y += state.player.vy;

    // Map Bounds
    if (state.player.x < 0) {
      state.player.x = 0;
      state.player.vx = 0;
    }
    if (state.player.x + state.player.width > MAP_WIDTH) {
      state.player.x = MAP_WIDTH - state.player.width;
      state.player.vx = 0;
    }

    // Platform Collisions (Player)
    for (const plat of state.platforms) {
      if (checkCollision(state.player, plat)) {
        // Vertical Collision
        if (state.player.vy > 0 && state.player.y + state.player.height - state.player.vy <= plat.y) {
          // Top collision (landing)
          state.player.y = plat.y - state.player.height;
          state.player.vy = 0;
        } else if (state.player.vy < 0 && state.player.y - state.player.vy >= plat.y + plat.height) {
          // Bottom collision (hitting head)
          state.player.y = plat.y + plat.height;
          state.player.vy = 0;
        } else {
          // Horizontal Collision (walls)
          if (state.player.vx > 0) {
            state.player.x = plat.x - state.player.width;
          } else if (state.player.vx < 0) {
            state.player.x = plat.x + plat.width;
          }
          state.player.vx = 0;
        }
      }
    }

    // Camera following player
    const targetCameraX = state.player.x - width / 2 + state.player.width / 2;
    state.cameraX = Math.max(0, Math.min(targetCameraX, MAP_WIDTH - width));

    // Bounds check (pit)
    if (state.player.y > height) {
      state.player.hp = 0;
    }

    // --- Collectibles ---
    state.collectibles.forEach(c => {
      if (!c.collected && checkCollision(state.player, c as unknown as Entity)) {
        c.collected = true;
        state.score += 500;
        spawnParticles(c.x + c.width/2, c.y + c.height/2, c.color, 15);
        
        // Check if all collected
        if (state.collectibles.every(item => item.collected)) {
          // Spawn portal at a random top layer platform
          const topPlatforms = state.platforms.filter(p => p.y < height / 2);
          const portalPlat = topPlatforms[Math.floor(Math.random() * topPlatforms.length)];
          state.portal = {
            x: portalPlat.x + portalPlat.width / 2 - 30,
            y: portalPlat.y - 80,
            width: 60,
            height: 80,
            vx: 0, vy: 0,
            color: '#8b5cf6', // purple
            hp: 1, maxHp: 1
          };
        }
      }
    });

    // --- Portal ---
    if (state.portal && checkCollision(state.player, state.portal)) {
      state.level += 1;
      state.score += 2000;
      generateLevel(width, height);
      spawnParticles(state.player.x, state.player.y, '#8b5cf6', 50);
      return; // Stop current update as level reset
    }

    // --- Enemies ---
    if (Math.random() < 0.005 * state.difficulty) {
      spawnEnemy(width, height, state.difficulty);
    }

    state.enemies.forEach((enemy, idx) => {
      const dir = state.player.x - enemy.x;
      enemy.vx = dir > 0 ? 2 : -2;
      
      enemy.vx *= FRICTION;
      enemy.vy += GRAVITY;
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      for (const plat of state.platforms) {
        if (checkCollision(enemy, plat)) {
           if (enemy.vy > 0 && enemy.y + enemy.height - enemy.vy <= plat.y) {
            enemy.y = plat.y - enemy.height;
            enemy.vy = 0;
          }
        }
      }

      if (checkCollision(enemy, state.player)) {
        state.player.hp -= 0.5;
        state.player.vx = (state.player.x - enemy.x) * 0.5;
        state.player.vy = -5;
      }
    });

    // --- Projectiles ---
    state.projectiles.forEach((proj, idx) => {
      proj.x += proj.vx;
      proj.y += proj.vy;
      
      if (proj.x < state.cameraX - 100 || proj.x > state.cameraX + width + 100 || proj.y < 0 || proj.y > height) {
        state.projectiles.splice(idx, 1);
        return;
      }

      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];
        if (checkCollision(proj, enemy)) {
          enemy.hp -= 20;
          state.projectiles.splice(idx, 1);
          spawnParticles(proj.x, proj.y, '#fff', 5);
          
          if (enemy.hp <= 0) {
            spawnParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color, 20);
            state.enemies.splice(i, 1);
            state.score += 100 * state.difficulty;
            state.coins += 5;
            if (onCoinCollect) onCoinCollect(5);
          }
          break;
        }
      }
    });

    // --- Particles ---
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) state.particles.splice(i, 1);
    }

    if (state.player.hp <= 0 && !state.isGameOver) {
      state.isGameOver = true;
      onGameOver({
        score: Math.floor(state.score),
        coins: state.coins,
        duration: Math.floor(state.time / 1000),
      });
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const state = gameState.current;
    
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);
    
    ctx.save();
    ctx.translate(-state.cameraX, 0);

    // Stars
    ctx.fillStyle = '#1e293b';
    for(let i=0; i<100; i++) {
        const x = (i * 1234 + state.time * 0.01) % MAP_WIDTH;
        const y = (i * 5678) % height;
        ctx.fillRect(x, y, 2, 2);
    }

    // Platforms
    state.platforms.forEach(p => {
      if (p.x + p.width > state.cameraX && p.x < state.cameraX + width) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(p.x, p.y, p.width, 2);
      }
    });

    // Collectibles
    state.collectibles.forEach(c => {
      if (!c.collected && c.x + c.width > state.cameraX && c.x < state.cameraX + width) {
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = c.color;
        // Draw as a rotating diamond
        ctx.save();
        ctx.translate(c.x + c.width/2, c.y + c.height/2);
        ctx.rotate(state.time * 0.005);
        ctx.fillRect(-c.width/2, -c.height/2, c.width, c.height);
        ctx.restore();
      }
    });

    // Portal
    if (state.portal && state.portal.x + state.portal.width > state.cameraX && state.portal.x < state.cameraX + width) {
      ctx.shadowColor = state.portal.color;
      ctx.shadowBlur = 25;
      ctx.fillStyle = state.portal.color;
      ctx.globalAlpha = 0.6 + Math.sin(state.time * 0.01) * 0.2;
      ctx.fillRect(state.portal.x, state.portal.y, state.portal.width, state.portal.height);
      ctx.globalAlpha = 1;
    }

    // Player
    if (state.player.hp > 0) {
      ctx.shadowColor = state.player.color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = state.player.color;
      ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);
      ctx.fillStyle = '#fff';
      ctx.fillRect(state.player.x + (state.player.vx >= 0 ? 20 : 4), state.player.y + 8, 8, 4);
    }

    // Enemies
    state.enemies.forEach(e => {
      if (e.x + e.width > state.cameraX && e.x < state.cameraX + width) {
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, e.width, e.height);
        ctx.fillStyle = '#333';
        ctx.fillRect(e.x, e.y - 10, e.width, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.x, e.y - 10, e.width * (e.hp / e.maxHp), 4);
      }
    });

    // Projectiles
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fbbf24';
    state.projectiles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Particles
    state.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    
    // HUD
    ctx.font = '20px "Press Start 2P"';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    const minutes = Math.floor(state.time / 60000);
    const seconds = Math.floor((state.time % 60000) / 1000).toString().padStart(2, '0');
    ctx.fillText(`${minutes}:${seconds}`, width / 2, 40);
    
    ctx.fillStyle = '#ef4444';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText(`DANGER: ${state.difficulty.toFixed(1)}x`, width / 2, 65);

    // Objectives
    const collectedCount = state.collectibles.filter(c => c.collected).length;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText(`OBJECTS: ${collectedCount}/5`, 20, 40);
    ctx.fillText(`LEVEL: ${state.level}`, 20, 65);
    
    if (collectedCount === 5) {
      ctx.fillStyle = '#8b5cf6';
      ctx.textAlign = 'center';
      ctx.fillText("PORTAL OPEN!", width / 2, height - 100);
    }
  };

  const checkCollision = (r1: Entity, r2: Entity) => {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  };

  const tick = (time: number) => {
    if (lastTimeRef.current === 0) lastTimeRef.current = time;
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      update(dt);
      draw(ctx);
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  // Shoot Handler
  useEffect(() => {
    const handleShoot = (e: MouseEvent) => {
        if (isPaused || gameState.current.isGameOver) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if(!rect) return;
        
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        const player = gameState.current.player;
        const angle = Math.atan2(my - (player.y + player.height/2), (mx + gameState.current.cameraX) - (player.x + player.width/2));
        
        const speed = 12;
        gameState.current.projectiles.push({
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            width: 8, height: 8,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#fbbf24',
            hp: 1, maxHp: 1
        });
    };
    
    window.addEventListener('mousedown', handleShoot);
    requestRef.current = requestAnimationFrame(tick);
    
    return () => {
        window.removeEventListener('mousedown', handleShoot);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [isPaused]); // Re-bind if pause state changes

  return <canvas ref={canvasRef} width={width} height={height} className="block touch-none cursor-crosshair" />;
}
