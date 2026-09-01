"use client";

import { useEffect, useState } from "react";

type Category = {
  key: string;
  label: string;
  items: Array<{ id: string; display: string }>;
};

export default function MobileShoppingChecklist({
  weekStart,
  categories,
}: {
  weekStart: string;
  categories: Category[];
}) {
  const storageKey = `ft:mobile-shopping:${weekStart}`;
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[];
        setChecked(new Set(stored));
      } catch {
        setChecked(new Set());
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  const toggle = (id: string) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <section key={category.key} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-black text-slate-800">{category.label}</h2>
          <ul>
            {category.items.map((item) => {
              const done = checked.has(item.id);
              return (
                <li key={item.id} className="border-b border-slate-100 last:border-0">
                  <button type="button" onClick={() => toggle(item.id)} className="flex w-full items-start gap-3 px-5 py-3.5 text-left">
                    <span className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border text-xs font-black ${done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"}`}>{done ? "✓" : ""}</span>
                    <span className={`text-sm leading-5 ${done ? "text-slate-400 line-through" : "text-slate-700"}`}>{item.display}</span>
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
