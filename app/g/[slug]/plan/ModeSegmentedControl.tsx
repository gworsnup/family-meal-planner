"use client";

import type React from "react";
import { useCallback } from "react";

type PlanMode = "recipes" | "templates";

type ModeSegmentedControlProps = {
  value: PlanMode;
  onChange: (nextValue: PlanMode) => void;
};

const options: Array<{ value: PlanMode; label: string }> = [
  { value: "recipes", label: "Recipes" },
  { value: "templates", label: "Templates" },
];

export function ModeSegmentedControl({ value, onChange }: ModeSegmentedControlProps) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const nextValue =
          value === "recipes" ? "templates" : "recipes";
        onChange(nextValue);
      }
    },
    [onChange, value],
  );

  return (
    <div
      role="radiogroup"
      aria-label="Plan mode"
      onKeyDown={handleKeyDown}
      className="relative flex w-full items-center rounded-full border border-slate-200 bg-[#fafafa] p-1 text-xs font-semibold text-slate-600"
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-1 left-1 z-0 w-1/2 rounded-full bg-slate-900 transition-transform duration-150 ease-out ${
          value === "recipes" ? "translate-x-0" : "translate-x-full"
        }`}
      />
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={`relative z-10 flex w-1/2 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-2 ${
              isSelected
                ? "text-white"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
