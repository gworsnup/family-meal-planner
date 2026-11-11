"use client";

import { useMemo, useState } from "react";
import { getSmartCategoryEmoji } from "@/lib/smartListPresentation";
import { buildSmartListShareText, buildWhatsAppShareUrl } from "@/lib/smartListShare";

type ShareCategory = {
  name: string;
  items: Array<{ id: string; displayText: string }>;
};

export default function MobileSmartListShare({
  weekStart,
  categories,
}: {
  weekStart: string;
  categories: ShareCategory[];
}) {
  const allItemIds = useMemo(
    () => categories.flatMap((category) => category.items.map((item) => item.id)),
    [categories],
  );
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const beginSelection = () => {
    setSelected(new Set(allItemIds));
    setOpen(true);
  };

  const toggle = (itemId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const selectedCategories = useMemo(
    () => categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => selected.has(item.id)),
      }))
      .filter((category) => category.items.length > 0),
    [categories, selected],
  );
  const shareHref = useMemo(
    () => buildWhatsAppShareUrl(buildSmartListShareText({ weekStart, categories: selectedCategories })),
    [selectedCategories, weekStart],
  );

  return (
    <>
      <button
        type="button"
        onClick={beginSelection}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <path d="M12 2a9.8 9.8 0 0 0-8.4 14.9L2 22l5.2-1.5A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.1.9.9-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.3.2-.4.6-.9.1-.1.1-.3 0-.5L9.6 8.5c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.2.2-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.9 3 4.7 4 .7.2 1.2.4 1.6.5.7.2 1.3.2 1.8.1.6-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.2-.2-.9-.5-1.3-.7Z" />
        </svg>
        Share Smart List on WhatsApp
      </button>

      {open ? (
        <div data-disable-pull-to-refresh className="fixed inset-0 z-[70] flex items-end bg-slate-950/40 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="share-list-title">
          <div className="flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-[#fcfcfc] shadow-2xl sm:max-w-lg sm:rounded-3xl">
            <div className="border-b border-slate-200 bg-white px-5 pb-4 pt-5 sm:rounded-t-3xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="share-list-title" className="text-xl font-semibold text-slate-900">Choose items to share</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-500">Everything is selected. Untick anything you already have.</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600" aria-label="Close sharing options">×</button>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">{selected.size} of {allItemIds.length} selected</span>
                <span className="flex gap-3">
                  <button type="button" onClick={() => setSelected(new Set(allItemIds))} className="text-slate-700 underline underline-offset-4">Select all</button>
                  <button type="button" onClick={() => setSelected(new Set())} className="text-slate-700 underline underline-offset-4">Clear all</button>
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {categories.map((category) => (
                <section key={category.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <h3 className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
                    <span aria-hidden="true">{getSmartCategoryEmoji(category.name)}</span>
                    {category.name}
                  </h3>
                  <ul className="divide-y divide-slate-100">
                    {category.items.map((item) => {
                      const included = selected.has(item.id);
                      return (
                        <li key={item.id}>
                          <button type="button" onClick={() => toggle(item.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left">
                            <span className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border text-xs ${included ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"}`}>
                              {included ? "✓" : ""}
                            </span>
                            <span className={`flex-1 text-sm leading-5 ${included ? "text-slate-800" : "text-slate-400 line-through"}`}>{item.displayText}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-3 border-t border-slate-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-b-3xl">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Cancel</button>
              {selected.size ? (
                <a href={shareHref} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="rounded-lg bg-[#25D366] px-4 py-3 text-center text-sm font-semibold text-white">
                  Share {selected.size} item{selected.size === 1 ? "" : "s"}
                </a>
              ) : (
                <button type="button" disabled className="rounded-lg bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-400">Select an item</button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
