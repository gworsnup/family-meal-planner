"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteRecipe } from "@/app/g/[slug]/cook/actions";

type RecipeCardProps = {
  slug: string;
  recipe: {
    id: string;
    title: string;
    photoUrl: string | null;
    totalTimeMinutes: number | null;
    cookTimeMinutes: number | null;
    sourceName: string | null;
  };
};

export default function RecipeCard({ slug, recipe }: RecipeCardProps) {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const start = useRef({ x: 0, y: 0, offset: 0 });
  const gesture = useRef<"pending" | "horizontal" | "vertical" | null>(null);
  const didSwipe = useRef(false);
  const minutes = recipe.totalTimeMinutes ?? recipe.cookTimeMinutes;

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch || isPending) return;
    start.current = { x: touch.clientX, y: touch.clientY, offset };
    gesture.current = "pending";
    didSwipe.current = false;
    setDragging(true);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch || !gesture.current) return;
    const deltaX = touch.clientX - start.current.x;
    const deltaY = touch.clientY - start.current.y;

    if (gesture.current === "pending" && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 6) {
      gesture.current = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
    }
    if (gesture.current !== "horizontal") return;

    event.preventDefault();
    didSwipe.current = true;
    setOffset(Math.max(-88, Math.min(0, start.current.offset + deltaX)));
  };

  const handleTouchEnd = () => {
    if (gesture.current === "horizontal") {
      setOffset((current) => (current <= -44 ? -88 : 0));
      window.setTimeout(() => {
        didSwipe.current = false;
      }, 300);
    }
    gesture.current = null;
    setDragging(false);
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete “${recipe.title}” from your library? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteRecipe(slug, recipe.id);
        router.refresh();
      } catch (caught) {
        setOffset(0);
        setError(caught instanceof Error ? caught.message : "Could not delete this recipe.");
      }
    });
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-rose-600">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="absolute inset-y-0 right-0 flex w-[88px] flex-col items-center justify-center gap-1 text-xs font-bold text-white disabled:opacity-60"
          aria-label={`Delete ${recipe.title}`}
        >
          <span className="text-3xl font-light leading-none" aria-hidden="true">×</span>
          {isPending ? "Deleting…" : "Delete"}
        </button>

        <Link
          href={`/mobile/${slug}/recipes/${recipe.id}`}
          onClick={(event) => {
            if (!didSwipe.current && offset === 0) return;
            event.preventDefault();
            setOffset(0);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="relative flex touch-pan-y gap-4 rounded-2xl border border-slate-200 bg-white p-3 hover:border-slate-300 hover:shadow-sm active:scale-[0.99]"
          style={{
            transform: `translateX(${offset}px)`,
            transition: dragging ? "none" : "transform 180ms ease-out",
          }}
        >
          {recipe.photoUrl ? (
            // Recipe images can come from arbitrary importer domains, so Next Image cannot safely enumerate hosts.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.photoUrl} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-24 w-24 flex-none rounded-xl object-cover" />
          ) : (
            <div className="flex h-24 w-24 flex-none items-center justify-center rounded-xl bg-slate-100 text-3xl">🍽️</div>
          )}
          <div className="min-w-0 flex-1 py-1">
            <h2 className="line-clamp-2 text-base font-semibold leading-5 text-slate-900">{recipe.title}</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              {minutes ? <span className="rounded-full bg-slate-100 px-2.5 py-1">{minutes} min</span> : null}
              {recipe.sourceName ? <span className="max-w-32 truncate rounded-full bg-slate-100 px-2.5 py-1">{recipe.sourceName}</span> : null}
            </div>
          </div>
          <span className="self-center text-xl text-slate-300" aria-hidden="true">›</span>
        </Link>
      </div>
      {error ? (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>
      ) : null}
    </div>
  );
}
