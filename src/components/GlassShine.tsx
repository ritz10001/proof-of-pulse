"use client";

import { useEffect, useRef } from "react";

const SELECTOR = ".glass, .glass-pink, .glass-pink-solid";

/**
 * Cursor = the sun. Every glass element on the page always catches its light.
 *
 * Physics:
 * - The "ray" from cursor to each element's center defines the angle of incidence.
 * - The specular reflection appears on the element's surface at the point
 *   where the ray enters — i.e. the side of the element facing the cursor.
 * - Closer elements get a brighter, tighter highlight (stronger reflection).
 * - Distant elements still glow, just softer — the sun never goes out.
 */
export default function GlassShine() {
  const rafRef = useRef(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    const update = () => {
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const els = document.querySelectorAll<HTMLElement>(SELECTOR);

      for (const el of els) {
        const rect = el.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        // Element center
        const cx = rect.left + w / 2;
        const cy = rect.top + h / 2;

        // Vector from element center to cursor (the "light direction")
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // --- Shine position ---
        // Project the light direction onto the element surface.
        // The highlight appears on the side facing the cursor.
        // When cursor is directly on the element, it tracks exactly.
        // When far away, it settles near the edge facing the cursor.
        let shineX: number;
        let shineY: number;

        if (dist < 1) {
          // Cursor is dead center
          shineX = w / 2;
          shineY = h / 2;
        } else {
          // Normalize direction
          const nx = dx / dist;
          const ny = dy / dist;

          // How far "into" the element the shine point is.
          // Close cursor → shine near center. Far cursor → shine near edge.
          // Use a sigmoid-like curve: proximity goes 1→0 as dist goes 0→∞
          const proximity = 1 / (1 + dist / 300);

          // Shine position: blend between center and the edge facing the cursor
          // Edge point = center + direction * half-size
          const edgeX = w / 2 + nx * (w / 2);
          const edgeY = h / 2 + ny * (h / 2);

          shineX = w / 2 + (edgeX - w / 2) * (1 - proximity);
          shineY = h / 2 + (edgeY - h / 2) * (1 - proximity);
        }

        // --- Intensity ---
        // Minimum brightness so distant elements always have some glow.
        // Uses smooth inverse falloff: bright up close, gentle floor far away.
        const MIN_INTENSITY = 0.15;
        const MAX_INTENSITY = 1;
        const falloff = 1 / (1 + (dist / 250) * (dist / 250));
        const intensity = MIN_INTENSITY + (MAX_INTENSITY - MIN_INTENSITY) * falloff;

        el.style.setProperty("--shine-x", `${shineX}px`);
        el.style.setProperty("--shine-y", `${shineY}px`);
        el.style.setProperty("--shine-opacity", `${intensity}`);
      }

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return null;
}
