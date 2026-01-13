"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/actions/auth";

type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string };

const initialState: LoginState = { status: "idle" };

type LoginFormProps = {
  next?: string;
  message?: string;
};

export default function LoginForm({ next, message }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const errorMessage = state.status === "error" ? state.message : message;

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <a
        href="/auth/google"
        className="flex w-full items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
      >
        Continue with Google
      </a>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
      </label>

      {errorMessage ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Signing in..." : "Log in"}
      </button>
    </form>
  );
}
