"use client";

import confetti from "canvas-confetti";

type ConfettiOrigin = {
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function fireConfetti(origin?: ConfettiOrigin | null) {
  if (typeof document === "undefined") return;

  const safeX = origin ? clamp(origin.x, 0.05, 0.95) : 0.5;

  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6, x: safeX },
  });
}
