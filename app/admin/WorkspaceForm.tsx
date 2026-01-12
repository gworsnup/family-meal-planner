"use client";

import { useActionState } from "react";

import { createWorkspaceAction } from "./actions";

type ActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message?: string };

const initialState: ActionState = { status: "idle" };

export default function WorkspaceForm() {
  const [state, formAction, pending] = useActionState(
    createWorkspaceAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-700">Name</label>
        <input
          name="name"
          required
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          placeholder="Household name"
        />
      </div>

      {state.status === "error" ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : "Add workspace"}
      </button>
    </form>
  );
}
