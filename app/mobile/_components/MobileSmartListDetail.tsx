"use client";

import { useEffect, useState } from "react";
import { getSmartCategoryEmoji } from "@/lib/smartListPresentation";
import MobileSmartListShare from "./MobileSmartListShare";

type SmartListCategory = {
  name: string;
  items: Array<{ id: string; displayText: string }>;
};

export default function MobileSmartListDetail({
  smartListId,
  weekStart,
  categories,
}: {
  smartListId: string;
  weekStart: string;
  categories: SmartListCategory[];
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const storageKey = `ft:mobile-smart-list:${smartListId}`;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setChecked(new Set(JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[]));
      } catch {
        setChecked(new Set());
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  const toggle = (itemId: string) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      localStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <MobileSmartListShare weekStart={weekStart} categories={categories} />

      {categories.map((category) => (
        <section key={category.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <h2 className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
            <span aria-hidden="true">{getSmartCategoryEmoji(category.name)}</span>
            {category.name}
          </h2>
          <ul className="divide-y divide-slate-100">
            {category.items.map((item) => {
              const done = checked.has(item.id);
              return (
                <li key={item.id}>
                  <button type="button" onClick={() => toggle(item.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left">
                    <span className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded border text-[10px] ${done ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}>
                      {done ? "✓" : ""}
                    </span>
                    <span className={`flex-1 text-sm leading-5 ${done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                      {item.displayText}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
