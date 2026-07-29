import Link from "next/link";
import { logoutAction } from "./actions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ledger font-display text-sm font-semibold text-paper">
              K
            </span>
            <span className="font-display text-lg font-semibold text-ink">
              Buku Kas
            </span>
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-line px-4 py-2 font-body text-xs font-semibold uppercase tracking-wide text-ink/70 transition hover:border-rose/40 hover:text-rose"
            >
              Keluar
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
    </div>
  );
}
