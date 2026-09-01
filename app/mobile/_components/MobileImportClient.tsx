"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { startRecipeImport } from "@/app/g/[slug]/cook/importActions";

type ImportStatus = "idle" | "queued" | "running" | "success" | "partial" | "failed";

export default function MobileImportClient({
  slug,
  initialUrl,
}: {
  slug: string;
  initialUrl: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const active = isPending || status === "queued" || status === "running";
  const isSocialUrl = useMemo(
    () => /(?:instagram\.com|tiktok\.com)/i.test(url),
    [url],
  );

  const pasteFromClipboard = async () => {
    try {
      const value = await navigator.clipboard.readText();
      if (!value.trim()) {
        setMessage("Your clipboard is empty. Copy the recipe link first.");
        return;
      }
      setUrl(value.trim());
      setMessage(null);
      setStatus("idle");
    } catch {
      setMessage("Paste permission wasn’t available. Press and hold the field to paste.");
    }
  };

  const beginImport = () => {
    const cleaned = url.trim();
    if (!cleaned) {
      setStatus("failed");
      setMessage("Paste an Instagram, TikTok, or recipe link first.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      try {
        const result = await startRecipeImport(slug, cleaned);
        setImportId(result.importId);
        setStatus("queued");
      } catch (error) {
        setStatus("failed");
        setMessage(error instanceof Error ? error.message : "Unable to start the import.");
      }
    });
  };

  useEffect(() => {
    if (!importId) return;
    let mounted = true;

    const poll = async () => {
      try {
        const response = await fetch(`/api/import/status?importId=${encodeURIComponent(importId)}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          status?: ImportStatus;
          error?: string | null;
          recipeId?: string | null;
        };
        if (!mounted || !response.ok || !data.status) return;

        setStatus(data.status);
        setMessage(data.error ?? null);
        if ((data.status === "success" || data.status === "partial") && data.recipeId) {
          router.replace(`/mobile/${slug}/import/review/${data.recipeId}`);
          return;
        }
        if (data.status === "failed") setImportId(null);
      } catch {
        // A later poll can recover from a transient connection failure.
      }
    };

    void poll();
    const timer = window.setInterval(poll, 1800);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [importId, router, slug]);

  const statusText = (() => {
    if (isPending) return "Starting import…";
    if (status === "queued") return "Recipe queued…";
    if (status === "running") {
      return isSocialUrl
        ? "Reading the post and turning it into a recipe…"
        : "Reading the recipe…";
    }
    if (status === "failed") return message ?? "The recipe could not be imported.";
    return message;
  })();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Add a recipe</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Import from a link</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Copy the link from Instagram or TikTok, then paste it here. FamilyTable uses the same importer as the desktop app.
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="mobile-recipe-url" className="text-sm font-semibold text-slate-800">
          Recipe link
        </label>
        <textarea
          id="mobile-recipe-url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            if (status === "failed") setStatus("idle");
            setMessage(null);
          }}
          disabled={active}
          rows={3}
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="https://www.instagram.com/reel/…"
          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
        />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => void pasteFromClipboard()}
            disabled={active}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-50"
          >
            Paste link
          </button>
          <button
            type="button"
            onClick={beginImport}
            disabled={active}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {active ? "Importing…" : "Import to library"}
          </button>
        </div>

        {statusText ? (
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-5 ${status === "failed" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
            <div className="flex items-center gap-3">
              {active ? <span className="h-4 w-4 flex-none animate-spin rounded-full border-2 border-emerald-800/20 border-t-emerald-800" /> : null}
              <span>{statusText}</span>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl bg-amber-50 p-5 text-sm leading-6 text-amber-950">
        <div className="flex items-center justify-between gap-3"><p className="font-bold">On iPhone</p><Link href={`/mobile/${slug}/shortcut`} className="rounded-full bg-amber-900 px-3 py-1.5 text-xs font-bold text-white">Set up Shortcut</Link></div>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Tap Share in Instagram or TikTok.</li>
          <li>Choose Copy link.</li>
          <li>Open FamilyTable and tap Paste link.</li>
        </ol>
      </section>

      <Link href={`/mobile/${slug}/recipes`} className="block text-center text-sm font-semibold text-slate-600">
        Browse recipe library
      </Link>
    </div>
  );
}
