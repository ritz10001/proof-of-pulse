"use client";

import { useRef, useEffect, useCallback } from "react";

const CELL_SIZE = 10;
const GAP = 2;
const STEP = CELL_SIZE + GAP;
const RADIUS = 70;
const BASE_ALPHA = 0.03;
const MAX_ALPHA = 0.3;
const BASE_SCALE = 1;
const MAX_SCALE = 2.6;
const DECAY = 0.92;

interface Cell {
  intensity: number;
}

export default function InteractiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const cellsRef = useRef<Cell[]>([]);
  const dimsRef = useRef({ cols: 0, rows: 0 });
  const rafRef = useRef<number>(0);
  const scrollRef = useRef(0);

  const initCells = useCallback(() => {
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

    const cols = Math.ceil(w / STEP);
    const rows = Math.ceil(h / STEP);
    dimsRef.current = { cols, rows };

    const totalCells = cols * rows;
    const prev = cellsRef.current;
    cellsRef.current = new Array(totalCells);
    for (let i = 0; i < totalCells; i++) {
      cellsRef.current[i] = { intensity: prev[i]?.intensity ?? 0 };
    }
  }, []);

  useEffect(() => {
    initCells();

    const onResize = () => initCells();
    window.addEventListener("resize", onResize);

    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    scrollRef.current = window.scrollY;

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
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [initCells]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const { cols, rows } = dimsRef.current;
      const cells = cellsRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          const cell = cells[idx];
          if (!cell) continue;

          const cx = col * STEP + CELL_SIZE / 2;
          const cy = row * STEP + CELL_SIZE / 2;

          const dx = mx - cx;
          const dy = my - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < RADIUS) {
            const proximity = 1 - dist / RADIUS;
            const target = proximity * proximity;
            if (target > cell.intensity) {
              cell.intensity = cell.intensity + (target - cell.intensity) * 0.3;
            }
          }

          cell.intensity *= DECAY;
          if (cell.intensity < 0.001) cell.intensity = 0;

          const t = cell.intensity;
          const alpha = BASE_ALPHA + t * (MAX_ALPHA - BASE_ALPHA);
          const scale = BASE_SCALE + t * (MAX_SCALE - BASE_SCALE);
          const size = CELL_SIZE * scale;
          const x = cx - size / 2;
          const y = cy - size / 2;

          // Color shifts from subtle pink to vivid reddish-pink
          const r = Math.round(214 + t * 17);
          const g = Math.round(53 - t * 20);
          const b = Math.round(85 - t * 10);

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fillRect(x, y, size, size);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
