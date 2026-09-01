"use client";

import { useEffect, useRef, useState } from "react";

const REFRESH_THRESHOLD = 72;
const MAX_PULL_DISTANCE = 108;

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const startY = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const updateDistance = (distance: number) => {
      pullDistanceRef.current = distance;
      setPullDistance(distance);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (
        refreshingRef.current ||
        event.touches.length !== 1 ||
        window.scrollY > 0
      ) {
        startY.current = null;
        setDragging(false);
        return;
      }

      startY.current = event.touches[0].clientY;
      setDragging(true);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (startY.current === null || event.touches.length !== 1) return;

      const dragDistance = event.touches[0].clientY - startY.current;
      if (dragDistance <= 0 || window.scrollY > 0) {
        updateDistance(0);
        return;
      }

      event.preventDefault();
      updateDistance(Math.min(MAX_PULL_DISTANCE, dragDistance * 0.45));
    };

    const handleTouchEnd = () => {
      if (startY.current === null) return;
      startY.current = null;
      setDragging(false);

      if (pullDistanceRef.current < REFRESH_THRESHOLD) {
        updateDistance(0);
        return;
      }

      refreshingRef.current = true;
      setRefreshing(true);
      updateDistance(58);

      window.setTimeout(() => {
        window.location.reload();
      }, 250);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  const ready = pullDistance >= REFRESH_THRESHOLD;
  const active = pullDistance > 0 || refreshing;

  return (
    <div className="relative min-h-screen overscroll-y-contain">
      <div
        className={`pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex justify-center transition-opacity duration-150 ${
          active ? "opacity-100" : "opacity-0"
        }`}
        aria-live="polite"
      >
        <div className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            style={refreshing ? undefined : { transform: `rotate(${Math.min(180, pullDistance * 2.5)}deg)` }}
            aria-hidden="true"
          >
            <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
          </svg>
          <span>{refreshing ? "Refreshing…" : ready ? "Release to refresh" : "Pull to refresh"}</span>
        </div>
      </div>

      <div
        className="min-h-screen bg-[#fcfcfc]"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: dragging ? "none" : "transform 180ms ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
