"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-lg border border-line bg-surface p-8"
      >
        <div>
          <p className="text-sm font-semibold tracking-tight text-ink">Workerp</p>
          <h1 className="mt-3 text-lg font-medium text-ink">Accedi</h1>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-muted">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-muted">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-pine-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Accesso in corso…" : "Accedi"}
        </button>
      </form>
    </div>
  );
}
