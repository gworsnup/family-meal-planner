"use client";

import { useActionState } from "react";

import { logoutAction } from "@/app/actions/auth";

import { createHouseholdAction } from "./actions";

type ActionState =
  | { status: "idle" }
  | { status: "error"; message: string };

const initialState: ActionState = { status: "idle" };

export default function HouseholdForm() {
  const [state, formAction, pending] = useActionState(
    createHouseholdAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Household name
        <input
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={60}
          autoComplete="organization"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
      </label>

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
        {pending ? "Creating..." : "Create household"}
      </button>
      <button
        type="submit"
        formAction={logoutAction}
        formNoValidate
        disabled={pending}
        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-70"
      >
        Cancel
      </button>
    </form>
  );
}
