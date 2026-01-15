"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { normalizeTagName } from "@/lib/normalizeTagName";

export type TagOption = {
  id: string;
  name: string;
};

type RecipeTagsMultiSelectProps = {
  selectedTags: TagOption[];
  workspaceTags: TagOption[];
  isOpen: boolean;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (tagId: string) => void;
  onCreateTag: (name: string) => void;
  onDeleteTag: (tagId: string) => void;
};

function formatTagName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export default function RecipeTagsMultiSelect({
  selectedTags,
  workspaceTags,
  isOpen,
  isPending,
  onOpenChange,
  onToggle,
  onCreateTag,
  onDeleteTag,
}: RecipeTagsMultiSelectProps) {
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [popoverStyles, setPopoverStyles] = useState<CSSProperties>({});

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && containerRef.current?.contains(target)) return;
      if (target && popoverRef.current?.contains(target)) return;
      onOpenChange(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onOpenChange(false);
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const popover = popoverRef.current;
      const popoverWidth = popover?.offsetWidth ?? 288;
      const popoverHeight = popover?.offsetHeight ?? 0;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const horizontalPadding = 12;
      const verticalPadding = 12;

      let left = Math.min(
        Math.max(horizontalPadding, rect.left),
        viewportWidth - popoverWidth - horizontalPadding,
      );
      let top = rect.bottom + 8;

      if (popoverHeight && top + popoverHeight > viewportHeight - verticalPadding) {
        top = rect.top - popoverHeight - 8;
      }

      top = Math.max(verticalPadding, top);
      left = Math.max(horizontalPadding, left);

      setPopoverStyles({
        top,
        left,
        width: popoverWidth,
      });
    };

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const normalizedSearch = normalizeTagName(search);
  const filteredTags = useMemo(() => {
    if (!normalizedSearch) return workspaceTags;
    return workspaceTags.filter((tag) =>
      normalizeTagName(tag.name).includes(normalizedSearch),
    );
  }, [normalizedSearch, workspaceTags]);

  const exactMatch = normalizedSearch
    ? workspaceTags.find((tag) => normalizeTagName(tag.name) === normalizedSearch)
    : null;

  return (
    <div ref={containerRef} className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpenChange(!isOpen)}
          disabled={isPending}
          aria-expanded={isOpen}
          ref={triggerRef}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <span className="flex items-center gap-1">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-4 w-4 text-slate-500"
              fill="currentColor"
            >
              <path d="M4.5 2.75a1.75 1.75 0 0 0-1.75 1.75v3.086c0 .464.184.909.513 1.237l6.414 6.414a1.75 1.75 0 0 0 2.475 0l3.111-3.11a1.75 1.75 0 0 0 0-2.476L8.85 3.25a1.75 1.75 0 0 0-1.237-.513H4.5Zm2.25 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
            </svg>
            <span>Tags</span>
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="h-4 w-4 text-slate-500"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.186l3.71-3.955a.75.75 0 1 1 1.08 1.04l-4.25 4.53a.75.75 0 0 1-1.08 0l-4.25-4.53a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {isOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              ref={popoverRef}
              style={popoverStyles}
              className="fixed z-[60] mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
            >
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && normalizedSearch && !exactMatch) {
                    event.preventDefault();
                    onCreateTag(search);
                    setSearch("");
                  }
                }}
                placeholder="Search tags…"
                className="mb-2 w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
              <div className="max-h-56 overflow-y-auto">
                {filteredTags.length > 0 ? (
                  filteredTags.map((tag) => {
                    const isApplied = selectedTags.some((item) => item.id === tag.id);
                    return (
                      <div
                        key={tag.id}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-slate-50 ${
                          isApplied ? "bg-slate-50" : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onToggle(tag.id)}
                          className="flex flex-1 items-center justify-between rounded-lg px-1 py-1 text-left"
                        >
                          <span>{tag.name}</span>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded border text-[11px] ${
                              isApplied
                                ? "border-black bg-black text-white"
                                : "border-slate-300 text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteTag(tag.id);
                          }}
                          aria-label={`Delete ${tag.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            className="h-3.5 w-3.5"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg px-3 py-2 text-sm text-slate-400">
                    No tags yet.
                  </div>
                )}
              </div>
              <div className="mt-2 border-t border-slate-100 pt-2">
                {normalizedSearch && !exactMatch ? (
                  <button
                    type="button"
                    onClick={() => {
                      onCreateTag(search);
                      setSearch("");
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Create “{formatTagName(search)}”
                  </button>
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-400">
                    Start typing to create a tag.
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )}
      </div>
      {selectedTags.length > 0 ? (
        selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-xs font-medium text-white"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => onToggle(tag.id)}
              className="ml-1 text-white/80 hover:text-white"
              aria-label={`Remove ${tag.name}`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-3.5 w-3.5"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </span>
        ))
      ) : (
        <span className="text-sm text-slate-400">No tags yet.</span>
      )}
    </div>
  );
}
