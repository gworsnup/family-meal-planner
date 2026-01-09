"use client";

import { useState } from "react";

type RatingStarsProps = {
  value: number;
  onSet: (value: number) => void;
  disabled?: boolean;
  stopPropagation?: boolean;
};

export default function RatingStars({
  value,
  onSet,
  disabled,
  stopPropagation,
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const filled = displayValue >= starValue;
        return (
          <button
            key={starValue}
            type="button"
            onClick={(event) => {
              if (stopPropagation) {
                event.stopPropagation();
              }
              if (disabled) return;
              onSet(value === starValue ? 0 : starValue);
            }}
            onMouseEnter={() => {
              if (!disabled) setHoverValue(starValue);
            }}
            onMouseLeave={() => setHoverValue(null)}
            onFocus={() => {
              if (!disabled) setHoverValue(starValue);
            }}
            onBlur={() => setHoverValue(null)}
            disabled={disabled}
            aria-label={`Set rating to ${starValue}`}
            className={`transition ${
              disabled ? "cursor-not-allowed" : "cursor-pointer hover:scale-110"
            }`}
          >
            <span
              className={`text-lg leading-none transition ${
                filled ? "text-amber-400" : "text-slate-300"
              }`}
            >
              {filled ? "★" : "☆"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
