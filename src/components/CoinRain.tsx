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
  { symbol: "XRP", color: "#1a1a1a", face: "#23292f", edge: "#111518", shine: "#4a5560" },
  { symbol: "BTC", color: "#7a4a00", face: "#f7931a", edge: "#b36a00", shine: "#ffc04a" },
  { symbol: "ETH", color: "#2b3a7a", face: "#627eea", edge: "#3a4fa8", shine: "#8ea0f5" },
  { symbol: "SOL", color: "#4a1a8a", face: "#9945ff", edge: "#6b28cc", shine: "#bb7aff" },
  { symbol: "ADA", color: "#001a60", face: "#0033ad", edge: "#002080", shine: "#3366dd" },
  { symbol: "DOT", color: "#800040", face: "#e6007a", edge: "#a80058", shine: "#ff4da0" },
];

// Draw bold coin logos — uses the full r for sizing, drawn directly in ellipse space
function drawLogo(ctx: CanvasRenderingContext2D, symbol: string, r: number, ry: number, logoColor: string) {
  ctx.save();
  ctx.fillStyle = logoColor;
  ctx.strokeStyle = logoColor;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Scale factor: draw in a circle then squish to match ellipse
  const sy = ry / r;
  const s = r * 0.6;
  const lw = Math.max(s * 0.22, 1.5);

  switch (symbol) {
    case "BTC": {
      // Bold ₿ — just use the character, biggest and boldest
      ctx.font = `900 ${Math.round(r * 1.1)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.scale(1, sy);
      ctx.fillText("₿", 0, 1);
      break;
    }
    case "ETH": {
      // Ethereum diamond — big and filled
      ctx.scale(1, sy);
      const dh = s * 1.1;
      const dw = s * 0.65;
      ctx.beginPath();
      ctx.moveTo(0, -dh);
      ctx.lineTo(dw, 0);
      ctx.lineTo(0, dh);
      ctx.lineTo(-dw, 0);
      ctx.closePath();
      ctx.fill();
      // Split line
      ctx.beginPath();
      ctx.moveTo(-dw * 0.9, -dh * 0.05);
      ctx.lineTo(dw * 0.9, -dh * 0.05);
      ctx.lineWidth = lw * 0.5;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
      break;
    }
    case "XRP": {
      // Bold X
      ctx.scale(1, sy);
      ctx.lineWidth = lw * 1.2;
      const xr = s * 0.7;
      ctx.beginPath();
      ctx.moveTo(-xr, -xr);
      ctx.lineTo(xr, xr);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xr, -xr);
      ctx.lineTo(-xr, xr);
      ctx.stroke();
      break;
    }
    case "SOL": {
      // Three bold horizontal bars
      ctx.scale(1, sy);
      ctx.lineWidth = lw;
      const bw = s * 0.75;
      const gap = s * 0.55;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-bw, i * gap);
        ctx.lineTo(bw, i * gap);
        ctx.stroke();
      }
      break;
    }
    case "ADA": {
      // Starburst — 6 dots in a ring + center
      ctx.scale(1, sy);
      const dotR = s * 0.18;
      const ringR = s * 0.55;
      ctx.beginPath();
      ctx.arc(0, 0, dotR * 1.2, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * ringR, Math.sin(a) * ringR, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "DOT": {
      // Big center dot
      ctx.scale(1, sy);
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

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
  tiltPhase: number;
  tiltBase: number;
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
      rotationSpeed: (Math.random() - 0.5) * 0.04,
      coinType: Math.floor(Math.random() * COINS.length),
      opacity: 0.7 + Math.random() * 0.3,
      grounded: false,
      bounced: false,
      scale: 0.8 + Math.random() * 0.4,
      tiltPhase: Math.random() * Math.PI * 2,
      tiltBase: 0.15 + Math.random() * 0.55,
    });

    const drawCoin = (coin: Coin) => {
      const { symbol, color, face, edge, shine } = COINS[coin.coinType];
      const r = COIN_SIZE * coin.scale * 0.5;
      const edgeH = r * 0.45;

      ctx.save();
      ctx.translate(coin.x, coin.y);
      ctx.globalAlpha = coin.opacity;

      // Per-coin tilt with wider variety
      const tilt = coin.tiltBase + 0.15 * Math.sin(coin.rotation + coin.tiltPhase);
      const ry = r * Math.max(tilt, 0.1);
      const bandH = edgeH * Math.max(1.2 - tilt, 0.15);

      // Drop shadow
      ctx.beginPath();
      ctx.ellipse(2, bandH + 3, r + 1, ry + 1, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fill();

      // === EDGE BAND ===
      ctx.beginPath();
      ctx.rect(-r, 0, r * 2, bandH);
      ctx.fillStyle = edge;
      ctx.fill();

      // Bottom cap
      ctx.beginPath();
      ctx.ellipse(0, bandH, r, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Side walls on top of bottom cap
      ctx.beginPath();
      ctx.rect(-r, 0, r * 2, bandH);
      ctx.fillStyle = edge;
      ctx.fill();

      // Side outlines
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(-r, bandH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(r, bandH);
      ctx.stroke();

      // Bottom rim outline
      ctx.beginPath();
      ctx.ellipse(0, bandH, r, ry, 0, 0, Math.PI);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Highlight stripe on edge
      ctx.beginPath();
      ctx.moveTo(-r + 2, bandH * 0.5);
      ctx.lineTo(r - 2, bandH * 0.5);
      ctx.strokeStyle = shine + "30";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // === TOP FACE ===
      ctx.beginPath();
      ctx.ellipse(0, 0, r, ry, 0, 0, Math.PI * 2);
      const faceGrad = ctx.createRadialGradient(-r * 0.25, -ry * 0.25, 0, 0, 0, r);
      faceGrad.addColorStop(0, shine);
      faceGrad.addColorStop(0.4, face);
      faceGrad.addColorStop(1, edge);
      ctx.fillStyle = faceGrad;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner rim ring
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.78, ry * 0.78, 0, 0, Math.PI * 2);
      ctx.strokeStyle = color + "40";
      ctx.lineWidth = 0.7;
      ctx.stroke();

      // Draw logo — white for max contrast on all coin faces
      drawLogo(ctx, symbol, r * 0.7, ry * 0.7, "rgba(255,255,255,0.9)");

      // Specular highlight arc
      ctx.beginPath();
      ctx.ellipse(-r * 0.15, -ry * 0.1, r * 0.4, ry * 0.3, -0.3, -Math.PI * 0.8, -Math.PI * 0.15);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

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
            const nx = dx / dist;
            const ny = dy / dist;
            const tangentStrength = (Math.random() - 0.3) * 1.5;
            coin.vx = nx * BOUNCE_STRENGTH + ny * tangentStrength;
            coin.vy = ny * BOUNCE_STRENGTH - Math.abs(nx) * 1.2 - 1;
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

          // Side boundaries
          if (coin.x < -COIN_SIZE * 2) coin.x = w + COIN_SIZE;
          if (coin.x > w + COIN_SIZE * 2) coin.x = -COIN_SIZE;
        } else {
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
