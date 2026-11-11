"use client";

import { useEffect, useMemo, useState } from "react";
import { getSmartCategoryEmoji } from "@/lib/smartListPresentation";
import { buildSmartListShareText, buildWhatsAppShareUrl } from "@/lib/smartListShare";

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
  const shareHref = useMemo(
    () => buildWhatsAppShareUrl(buildSmartListShareText({ weekStart, categories })),
    [categories, weekStart],
  );

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
      <a
        href={shareHref}
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <path d="M12 2a9.8 9.8 0 0 0-8.4 14.9L2 22l5.2-1.5A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.1.9.9-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.3.2-.4.6-.9.1-.1.1-.3 0-.5L9.6 8.5c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.2.2-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.9 3 4.7 4 .7.2 1.2.4 1.6.5.7.2 1.3.2 1.8.1.6-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.2-.2-.9-.5-1.3-.7Z" />
        </svg>
        Share list on WhatsApp
      </a>

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
