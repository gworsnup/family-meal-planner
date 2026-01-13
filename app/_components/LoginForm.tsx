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
        <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.1C12.4 13.2 17.7 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.1 24.5c0-1.7-.1-3-.4-4.3H24v8.1h12.4c-.6 3-2.3 5.6-4.9 7.4l7.5 5.8c4.3-4 6.8-9.9 6.8-17z"
            />
            <path
              fill="#FBBC05"
              d="M10.6 28.9c-.5-1.6-.8-3.2-.8-4.9s.3-3.3.8-4.9l-7.9-6.1C.9 16.7 0 20.3 0 24s.9 7.3 2.7 10.9l7.9-6z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.3 0 11.6-2.1 15.4-5.7l-7.5-5.8c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.6-3.7-13.5-9.4l-7.9 6C6.6 42.6 14.6 48 24 48z"
            />
          </svg>
        </span>
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
