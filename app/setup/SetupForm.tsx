"use client";

import { useActionState } from "react";

type SetupState =
  | { status: "idle" }
  | { status: "success"; workspaceSlug: string }
  | { status: "error"; message: string };

type Props = {
  action: (_prevState: SetupState, formData: FormData) => Promise<SetupState>;
  secret: string;
  defaultName: string;
};

const initialState: SetupState = { status: "idle" };

export function SetupForm({ action, secret, defaultName }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
      <input type="hidden" name="secret" value={secret} />

      <label style={{ display: "grid", gap: 4 }}>
        <span>Workspace name</span>
        <input
          name="name"
          required
          defaultValue={defaultName}
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
        />
      </label>

      <label style={{ display: "grid", gap: 4 }}>
        <span>Passcode</span>
        <input
          name="passcode"
          required
          type="password"
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        style={{ padding: 10, borderRadius: 4, background: "#111827", color: "white" }}
      >
        {pending ? "Setting up..." : "Save workspace"}
      </button>

      {state.status === "success" && (
        <p style={{ marginTop: 8 }}>
          Workspace ready: <a href={`/g/${state.workspaceSlug}`}>{`/g/${state.workspaceSlug}`}</a>
        </p>
      )}

      {state.status === "error" && (
        <p style={{ color: "#b91c1c" }}>{state.message}</p>
      )}
    </form>
  );
}
