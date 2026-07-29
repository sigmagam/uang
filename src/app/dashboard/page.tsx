import Link from "next/link";
import { sql } from "@/lib/db";
import { formatRupiah } from "@/lib/format";
import {
  addMemberAction,
  deleteMemberAction,
  addSetoranAction,
  addPengeluaranAction,
} from "./actions";
import SubmitButton from "@/components/SubmitButton";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

interface MemberRow {
  id: number;
  name: string;
  total_setoran: string;
}

interface KasTotals {
  total_setoran: string;
  total_pengeluaran: string;
}

async function getMembers(): Promise<MemberRow[]> {
  const rows = (await sql`
    SELECT
      m.id,
      m.name,
      COALESCE(SUM(t.amount), 0) AS total_setoran
    FROM members m
    LEFT JOIN transactions t ON t.member_id = m.id AND t.type = 'saldo'
    GROUP BY m.id, m.name
    ORDER BY m.name ASC
  `) as unknown as MemberRow[];
  return rows;
}

async function getKasTotals(): Promise<KasTotals> {
  const rows = (await sql`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'saldo' THEN amount ELSE 0 END), 0) AS total_setoran,
      COALESCE(SUM(CASE WHEN type = 'pengeluaran' THEN amount ELSE 0 END), 0) AS total_pengeluaran
    FROM transactions
  `) as unknown as KasTotals[];
  return rows[0];
}

interface RecentPengeluaran {
  id: number;
  amount: string;
  description: string | null;
  date: string;
}

async function getRecentPengeluaran(): Promise<RecentPengeluaran[]> {
  const rows = (await sql`
    SELECT id, amount, description, date
    FROM transactions
    WHERE type = 'pengeluaran'
    ORDER BY date DESC, created_at DESC
    LIMIT 6
  `) as unknown as RecentPengeluaran[];
  return rows;
}

function toDateStr(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function formatDateShort(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function DashboardPage() {
  const [members, totals, recentPengeluaran] = await Promise.all([
    getMembers(),
    getKasTotals(),
    getRecentPengeluaran(),
  ]);

  const totalSetoran = Number(totals.total_setoran);
  const totalPengeluaran = Number(totals.total_pengeluaran);
  const sisaSaldo = totalSetoran - totalPengeluaran;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-1 font-display text-xs uppercase tracking-[0.3em] text-ledger/70">
            Ringkasan
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Dashboard Kas Bersama
          </h1>
        </div>
      </div>

      {/* Summary cards — ONE shared balance, not per person */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Jumlah Anggota" value={String(members.length)} />
        <StatCard
          label="Total Setoran Masuk"
          value={formatRupiah(totalSetoran)}
          tone="ledger"
        />
        <StatCard
          label="Total Pengeluaran"
          value={formatRupiah(totalPengeluaran)}
          tone="rose"
        />
        <StatCard
          label="Saldo Kas Saat Ini"
          value={formatRupiah(sisaSaldo)}
          tone={sisaSaldo >= 0 ? "ledger" : "rose"}
          emphasized
        />
      </div>

      {/* Add member */}
      <details className="group mb-4 rounded-card border border-line bg-white/70 shadow-card">
        <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-body text-sm font-semibold text-ink">
          <span>+ Tambah Anggota Baru</span>
          <span className="text-ink/40 transition group-open:rotate-45">
            +
          </span>
        </summary>
        <form
          action={addMemberAction}
          className="grid grid-cols-1 gap-4 border-t border-line px-6 py-5 md:grid-cols-4"
        >
          <div className="md:col-span-2">
            <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-ink/60">
              Nama Anggota
            </label>
            <input
              name="name"
              required
              placeholder="mis. Budi Santoso"
              className="w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ledger focus:ring-2 focus:ring-ledger/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-ink/60">
              Setoran Awal (opsional)
            </label>
            <input
              name="initial_setoran"
              type="number"
              min={0}
              step="1000"
              placeholder="0"
              className="w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ledger focus:ring-2 focus:ring-ledger/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-ink/60">
              Tanggal
            </label>
            <input
              name="initial_date"
              type="date"
              defaultValue={today}
              className="w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ledger focus:ring-2 focus:ring-ledger/20"
            />
          </div>
          <div className="md:col-span-4">
            <SubmitButton className="rounded-full bg-ledger px-6 py-2.5 text-sm font-semibold text-paper transition hover:bg-ledger-dark disabled:opacity-60">
              Simpan Anggota
            </SubmitButton>
          </div>
        </form>
      </details>

      {/* Add setoran (deposit) — tied to a member */}
      <details className="group mb-4 rounded-card border border-line bg-white/70 shadow-card">
        <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-body text-sm font-semibold text-ink">
          <span>+ Catat Setoran Mingguan</span>
          <span className="text-ink/40 transition group-open:rotate-45">
            +
          </span>
        </summary>
        {members.length === 0 ? (
          <p className="border-t border-line px-6 py-5 font-body text-sm text-ink/50">
            Tambahkan anggota dulu sebelum mencatat setoran.
          </p>
        ) : (
          <form
            action={addSetoranAction}
            className="grid grid-cols-1 gap-4 border-t border-line px-6 py-5 md:grid-cols-5"
          >
            <input type="hidden" name="redirect_to" value="/dashboard" />
            <div>
              <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-ink/60">
                Anggota
              </label>
              <select
                name="member_id"
                required
                className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ledger focus:ring-2 focus:ring-ledger/20"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-ink/60">
                Jumlah (Rp)
              </label>
              <input
                name="amount"
                type="number"
                min={1}
                step="1000"
                required
                placeholder="50000"
                className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ledger focus:ring-2 focus:ring-ledger/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-ink/60">
                Tanggal
              </label>
              <input
                name="date"
                type="date"
                defaultValue={today}
                required
                className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ledger focus:ring-2 focus:ring-ledger/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-ink/60">
                Keterangan (opsional)
              </label>
              <input
                name="description"
                type="text"
                placeholder="mis. setoran minggu ke-1"
                className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ledger focus:ring-2 focus:ring-ledger/20"
              />
            </div>
            <div className="md:col-span-5">
              <SubmitButton className="rounded-full bg-ledger px-6 py-2.5 text-sm font-semibold text-paper transition hover:bg-ledger-dark disabled:opacity-60">
                Simpan Setoran
              </SubmitButton>
            </div>
          </form>
        )}
      </details>

      {/* Add pengeluaran (expense) — comes out of the shared total, no member */}
      <details className="group mb-8 rounded-card border border-line bg-white/70 shadow-card">
        <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-body text-sm font-semibold text-ink">
          <span>+ Catat Pengeluaran Kas</span>
          <span className="text-ink/40 transition group-open:rotate-45">
            +
          </span>
        </summary>
        <form
          action={addPengeluaranAction}
          className="grid grid-cols-1 gap-4 border-t border-line px-6 py-5 md:grid-cols-4"
        >
          <input type="hidden" name="redirect_to" value="/dashboard" />
          <div>
            <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-ink/60">
              Jumlah (Rp)
            </label>
            <input
              name="amount"
              type="number"
              min={1}
              step="1000"
              required
              placeholder="50000"
              className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-ink/60">
              Tanggal
            </label>
            <input
              name="date"
              type="date"
              defaultValue={today}
              required
              className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-ink/60">
              Keterangan
            </label>
            <input
              name="description"
              type="text"
              placeholder="mis. beli galon + snack rapat"
              className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </div>
          <div className="md:col-span-4">
            <SubmitButton className="rounded-full bg-rose px-6 py-2.5 text-sm font-semibold text-paper transition hover:bg-rose/90 disabled:opacity-60">
              Simpan Pengeluaran
            </SubmitButton>
          </div>
        </form>
      </details>

      {/* Member list — total setoran per person, NOT a balance */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">
          Setoran per Anggota
        </h2>
      </div>
      {members.length === 0 ? (
        <div className="mb-8 rounded-card border border-dashed border-line bg-white/40 px-6 py-14 text-center">
          <p className="font-display text-lg text-ink/60">
            Belum ada anggota
          </p>
          <p className="mt-1 font-body text-sm text-ink/40">
            Tambahkan anggota pertama lewat form di atas.
          </p>
        </div>
      ) : (
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const setoran = Number(m.total_setoran);
            return (
              <div
                key={m.id}
                className="flex flex-col rounded-card border border-line bg-white/70 p-5 shadow-card"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-display text-lg font-semibold text-ink">
                    {m.name}
                  </h3>
                </div>

                <p className="mb-1 font-body text-xs uppercase tracking-wide text-ink/40">
                  Total Setoran
                </p>
                <p className="mb-5 font-display text-2xl font-semibold tabular text-ledger-dark">
                  {formatRupiah(setoran)}
                </p>

                <div className="mt-auto flex items-center gap-2">
                  <Link
                    href={`/dashboard/member/${m.id}`}
                    className="flex-1 rounded-full bg-ink px-4 py-2 text-center font-body text-xs font-semibold text-paper transition hover:bg-ink/80"
                  >
                    Riwayat Setoran
                  </Link>
                  <form action={deleteMemberAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`Hapus anggota "${m.name}"? Semua catatan setorannya juga akan terhapus.`}
                      className="rounded-full border border-line px-3 py-2 font-body text-xs font-semibold text-ink/50 transition hover:border-rose/40 hover:text-rose"
                    >
                      Hapus
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent pengeluaran — shared, not tied to anyone */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">
          Pengeluaran Terbaru
        </h2>
        <Link
          href="/dashboard/pengeluaran"
          className="font-body text-xs font-semibold text-ledger-dark hover:underline"
        >
          Lihat Semua &rarr;
        </Link>
      </div>
      <div className="overflow-hidden rounded-card border border-line bg-white/70 shadow-card">
        {recentPengeluaran.length === 0 ? (
          <p className="px-5 py-8 text-center font-body text-sm text-ink/40">
            Belum ada pengeluaran yang dicatat.
          </p>
        ) : (
          <table className="w-full font-body text-sm">
            <tbody>
              {recentPengeluaran.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0">
                  <td className="w-28 px-5 py-2.5 text-xs text-ink/50">
                    {formatDateShort(toDateStr(t.date))}
                  </td>
                  <td className="px-2 py-2.5 text-ink/70">
                    {t.description || <span className="text-ink/30">—</span>}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular font-semibold text-rose">
                    -{formatRupiah(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
  emphasized = false,
}: {
  label: string;
  value: string;
  tone?: "default" | "ledger" | "rose";
  emphasized?: boolean;
}) {
  const toneClass =
    tone === "ledger"
      ? "text-ledger-dark"
      : tone === "rose"
      ? "text-rose"
      : "text-ink";

  return (
    <div
      className={`rounded-card border border-line p-4 shadow-card ${
        emphasized ? "bg-ledger/5" : "bg-white/70"
      }`}
    >
      <p className="mb-1 font-body text-[11px] uppercase tracking-wide text-ink/40">
        {label}
      </p>
      <p className={`tabular font-display text-xl font-semibold ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
