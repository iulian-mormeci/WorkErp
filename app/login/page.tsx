"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { BrandMark } from "@/components/brand-mark";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper bg-[radial-gradient(60rem_30rem_at_50%_-10%,color-mix(in_srgb,var(--color-pine)_12%,transparent),transparent)] px-4">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-5 rounded-xl border border-line bg-surface p-8"
      >
        <div className="flex items-center gap-2.5">
          <BrandMark className="size-8" />
          <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">Workerp</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Accedi</h1>
          <p className="mt-1 text-sm text-muted">Inserisci le tue credenziali per continuare.</p>
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

        {state?.error && (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-pine-strong px-3 py-2.5 text-sm font-medium text-white hover:bg-pine disabled:opacity-50"
        >
          {pending ? "Accesso in corso…" : "Accedi"}
        </button>
      </form>
    </div>
  );
}
