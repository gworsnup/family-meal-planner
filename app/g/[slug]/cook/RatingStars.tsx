"use client";

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
  return (
    <div style={{ display: "inline-flex", gap: 4 }}>
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const filled = value >= starValue;
        return (
          <button
            key={starValue}
            type="button"
            onClick={(event) => {
              if (stopPropagation) {
                event.stopPropagation();
              }
              onSet(value === starValue ? 0 : starValue);
            }}
            disabled={disabled}
            aria-label={`Set rating to ${starValue}`}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: disabled ? "not-allowed" : "pointer",
              color: filled ? "#f59e0b" : "#cbd5f5",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            {filled ? "★" : "☆"}
          </button>
        );
      })}
    </div>
  );
}
