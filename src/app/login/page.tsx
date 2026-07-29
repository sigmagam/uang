"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-ledger px-6 py-3 font-body text-sm font-semibold tracking-wide text-paper transition hover:bg-ledger-dark disabled:opacity-60"
    >
      {pending ? "Memeriksa..." : "Masuk"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState<LoginState, FormData>(
    login,
    undefined
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="relative w-full max-w-sm">
        {/* stamp signature element */}
        <div className="absolute -right-4 -top-8 flex h-20 w-20 -rotate-12 items-center justify-center rounded-full border-2 border-rose/70 text-rose/80">
          <span className="font-display text-[11px] font-semibold uppercase tracking-widest">
            Buku
            <br />
            Kas
          </span>
        </div>

        <div className="mb-8 text-center">
          <p className="mb-1 font-display text-xs uppercase tracking-[0.3em] text-ledger/70">
            Admin
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Masuk ke Buku Kas
          </h1>
          <p className="mt-2 font-body text-sm text-ink/60">
            Khusus admin — kelola saldo dan pengeluaran member
          </p>
        </div>

        <form
          action={formAction}
          className="rounded-card border border-line bg-white/70 p-7 shadow-card backdrop-blur-sm"
        >
          <div className="mb-4">
            <label
              htmlFor="username"
              className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-ink/60"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="w-full rounded-lg border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink outline-none transition focus:border-ledger focus:ring-2 focus:ring-ledger/20"
              placeholder="admin"
            />
          </div>

          <div className="mb-5">
            <label
              htmlFor="password"
              className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-ink/60"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink outline-none transition focus:border-ledger focus:ring-2 focus:ring-ledger/20"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div className="mb-4 rounded-lg border border-rose/30 bg-rose/10 px-4 py-2.5 font-body text-sm text-rose">
              {state.error}
            </div>
          )}

          <SubmitButton />
        </form>

        <p className="mt-6 text-center font-body text-xs text-ink/40">
          Member tidak memerlukan akun — hanya admin yang login.
        </p>
      </div>
    </main>
  );
}
