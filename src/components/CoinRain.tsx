"use client";

import { useRef, useEffect, useCallback } from "react";

const COIN_SIZE = 26;
const GRAVITY = 0.02;
const DRAG = 0.995;
const CURSOR_RADIUS = 60;
const BOUNCE_STRENGTH = 2.5;
const GROUND_FADE_SPEED = 0.015;
const MAX_COINS = 60;
const SPAWN_INTERVAL = 250;

const COINS = [
  { symbol: "XRP", color: "#2c2c2c", bg: "#ffffff" },
  { symbol: "BTC", color: "#f7931a", bg: "#fff4e0" },
  { symbol: "ETH", color: "#627eea", bg: "#eef0ff" },
  { symbol: "SOL", color: "#9945ff", bg: "#f3eaff" },
  { symbol: "ADA", color: "#0033ad", bg: "#e6edff" },
  { symbol: "DOT", color: "#e6007a", bg: "#ffe6f2" },
];

interface Coin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  coinType: number;
  opacity: number;
  grounded: boolean;
  bounced: boolean;
  scale: number;
}

export default function CoinRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const coinsRef = useRef<Coin[]>([]);
  const rafRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener("mousemove", onMouseMove);

    const onMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [resize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const spawnCoin = (canvasW: number): Coin => ({
      x: Math.random() * canvasW,
      y: -COIN_SIZE - Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.2,
      vy: 0.15 + Math.random() * 0.3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      coinType: Math.floor(Math.random() * COINS.length),
      opacity: 0.7 + Math.random() * 0.3,
      grounded: false,
      bounced: false,
      scale: 0.8 + Math.random() * 0.4,
    });

    const drawCoin = (coin: Coin) => {
      const { symbol, color, bg } = COINS[coin.coinType];
      const r = COIN_SIZE * coin.scale * 0.5;

      ctx.save();
      ctx.translate(coin.x, coin.y);
      ctx.rotate(coin.rotation);
      ctx.globalAlpha = coin.opacity;

      // Coin body - slight 3D squish based on rotation
      const squish = 0.6 + 0.4 * Math.abs(Math.cos(coin.rotation * 0.5));

      ctx.scale(squish, 1);

      // Shadow
      ctx.beginPath();
      ctx.arc(1, 1, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fill();

      // Main circle
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner ring
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
      ctx.strokeStyle = color + "40";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Symbol text
      ctx.fillStyle = color;
      ctx.font = `bold ${Math.round(r * 0.7)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(symbol, 0, 0.5);

      ctx.restore();
    };

    const draw = (timestamp: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Spawn new coins
      if (
        timestamp - lastSpawnRef.current > SPAWN_INTERVAL &&
        coinsRef.current.length < MAX_COINS
      ) {
        coinsRef.current.push(spawnCoin(w));
        lastSpawnRef.current = timestamp;
      }

      const alive: Coin[] = [];

      for (const coin of coinsRef.current) {
        if (!coin.grounded) {
          // Apply gravity
          coin.vy += GRAVITY;

          // Apply drag
          coin.vx *= DRAG;
          coin.vy *= DRAG;

          // Cursor collision
          const dx = coin.x - mx;
          const dy = coin.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CURSOR_RADIUS && !coin.bounced) {
            coin.bounced = true;
            // Normalize direction from cursor to coin
            const nx = dx / dist;
            const ny = dy / dist;

            // Deflect based on where the coin hits relative to cursor
            const tangentStrength = (Math.random() - 0.3) * 1.5;
            coin.vx = nx * BOUNCE_STRENGTH + ny * tangentStrength;
            coin.vy = ny * BOUNCE_STRENGTH - Math.abs(nx) * 1.2 - 1;

            // Add some spin
            coin.rotationSpeed += (Math.random() - 0.5) * 0.1;
          }

          // Move
          coin.x += coin.vx;
          coin.y += coin.vy;
          coin.rotation += coin.rotationSpeed;

          // Ground check
          if (coin.y > h - COIN_SIZE * coin.scale * 0.5) {
            coin.y = h - COIN_SIZE * coin.scale * 0.5;
            coin.grounded = true;
            coin.vx = 0;
            coin.vy = 0;
          }

          // Side boundaries - soft wrap
          if (coin.x < -COIN_SIZE * 2) coin.x = w + COIN_SIZE;
          if (coin.x > w + COIN_SIZE * 2) coin.x = -COIN_SIZE;
        } else {
          // Fade out on ground
          coin.opacity -= GROUND_FADE_SPEED;
        }

        if (coin.opacity > 0) {
          drawCoin(coin);
          alive.push(coin);
        }
      }

      coinsRef.current = alive;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      aria-hidden="true"
    />
  );
}
