"use client";

import { useState, useTransition } from "react";
import { createShortcutImportToken, revokeShortcutImportToken } from "@/app/mobile/[slug]/shortcut/actions";

type TokenSummary = {
  id: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export default function ShortcutSetupClient({ slug, endpoint, tokens }: { slug: string; endpoint: string; tokens: TokenSummary[] }) {
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const create = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await createShortcutImportToken(slug);
        setNewToken(result.token);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not create a Shortcut token.");
      }
    });
  };

  const copyToken = async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
  };

  const revoke = (tokenId: string) => {
    startTransition(async () => {
      try {
        await revokeShortcutImportToken(slug, tokenId);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not revoke the token.");
      }
    });
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">1. Create a private token</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">This lets only your Shortcut add recipes to this workspace. You can revoke it at any time.</p>
        <button type="button" onClick={create} disabled={pending} className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
          {pending ? "Working…" : "Create Shortcut token"}
        </button>

        {newToken ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Copy now — it is only shown once</p>
            <code className="mt-2 block break-all text-xs leading-5 text-amber-950">{newToken}</code>
            <button type="button" onClick={() => void copyToken()} className="mt-3 rounded-xl bg-amber-900 px-3 py-2 text-xs font-bold text-white">{copied ? "Copied" : "Copy token"}</button>
          </div>
        ) : null}
        {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">2. Build “Save Recipe” in Shortcuts</h2>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-700">
          <li>Create a new Shortcut named <strong>Save Recipe</strong>.</li>
          <li>Open its details and enable <strong>Show in Share Sheet</strong>. Set accepted input to <strong>URLs</strong>.</li>
          <li>Add <strong>Get Contents of URL</strong>.</li>
          <li>Use the endpoint below, choose <strong>POST</strong>, and set the request body to JSON.</li>
          <li>Add a JSON field named <code>url</code> whose value is <strong>Shortcut Input</strong>.</li>
          <li>Add header <code>Authorization</code> with value <code>Bearer YOUR_TOKEN</code>, replacing <code>YOUR_TOKEN</code> with the token above.</li>
          <li>Optionally add <strong>Show Notification</strong> with “Recipe sent to FamilyTable”.</li>
        </ol>
        <div className="mt-4 rounded-2xl bg-slate-100 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Endpoint</p>
          <code className="mt-2 block break-all text-xs text-slate-800">{endpoint}</code>
        </div>
      </section>

      {tokens.length ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold">Active tokens</h2>
          <div className="mt-3 space-y-3">{tokens.map((token) => (
            <div key={token.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
              <div><p className="text-sm font-bold">{token.label}</p><p className="mt-1 text-xs text-slate-500">{token.lastUsedAt ? `Last used ${new Date(token.lastUsedAt).toLocaleDateString("en-GB")}` : "Not used yet"}</p></div>
              <button type="button" onClick={() => revoke(token.id)} disabled={pending} className="text-xs font-bold text-rose-700">Revoke</button>
            </div>
          ))}</div>
        </section>
      ) : null}
    </div>
  );
}
