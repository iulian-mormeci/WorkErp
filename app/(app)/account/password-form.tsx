"use client";

import { useActionState, useRef } from "react";
import { changePassword } from "./actions";

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (prevState: Awaited<ReturnType<typeof changePassword>>, formData: FormData) => {
      const result = await changePassword(prevState, formData);
      if (result?.success) formRef.current?.reset();
      return result;
    },
    undefined
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm text-muted">Password attuale</label>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-muted">Nuova password</label>
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-muted">Conferma nuova password</label>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-pine-strong">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-paper disabled:opacity-50"
      >
        {pending ? "Aggiornamento…" : "Cambia password"}
      </button>
    </form>
  );
}
