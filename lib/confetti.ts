"use client";

type ConfettiOrigin = {
  x: number;
  y: number;
};

const CONFETTI_COLORS = ["#f97316", "#fb7185", "#60a5fa", "#34d399", "#fbbf24"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function fireConfetti(origin?: ConfettiOrigin | null) {
  if (typeof document === "undefined") return;

  const safeOrigin = origin
    ? {
        x: clamp(origin.x, 0.05, 0.95),
        y: clamp(origin.y, 0.05, 0.95),
      }
    : { x: 0.5, y: 0.35 };

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.inset = "0";
  container.style.pointerEvents = "none";
  container.style.zIndex = "9999";
  document.body.appendChild(container);

  const startX = safeOrigin.x * window.innerWidth;
  const startY = safeOrigin.y * window.innerHeight;
  const particleCount = 28;
  const duration = 900;

  for (let i = 0; i < particleCount; i += 1) {
    const piece = document.createElement("div");
    const size = 6 + Math.random() * 6;
    piece.style.position = "absolute";
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 0.6}px`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.left = `${startX}px`;
    piece.style.top = `${startY}px`;
    piece.style.borderRadius = "2px";
    piece.style.opacity = "0.9";
    container.appendChild(piece);

    const travelX = (Math.random() - 0.5) * 240;
    const travelY = 120 + Math.random() * 180;
    const rotation = (Math.random() - 0.5) * 360;

    piece.animate(
      [
        { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${travelX}px, ${travelY}px) rotate(${rotation}deg)`,
          opacity: 0,
        },
      ],
      {
        duration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    );
  }

  window.setTimeout(() => {
    container.remove();
  }, duration + 120);
}
