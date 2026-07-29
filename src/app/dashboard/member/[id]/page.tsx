import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { formatRupiah } from "@/lib/format";
import {
  getWeekBucketsForMonth,
  formatDateRange,
  formatDateShort,
  parseSQLDate,
  bucketIndexForDate,
  shiftMonth,
  MONTH_NAMES_ID,
  type WeekBucket,
} from "@/lib/weeks";
import { addSetoranAction, deleteTransactionAction } from "../../actions";
import SubmitButton from "@/components/SubmitButton";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

interface TxRow {
  id: number;
  amount: string;
  description: string | null;
  date: string;
}

function toDateStr(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { month?: string };
}) {
  const memberId = Number(params.id);
  if (!memberId) notFound();

  const memberRows = (await sql`
    SELECT id, name FROM members WHERE id = ${memberId}
  `) as unknown as { id: number; name: string }[];
  const member = memberRows[0];
  if (!member) notFound();

  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1;
  if (searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month)) {
    const [y, m] = searchParams.month.split("-").map(Number);
    year = y;
    month = m;
  }

  const buckets = getWeekBucketsForMonth(year, month);
  const rangeStart = toDateStr(buckets[0].start);
  const rangeEnd = toDateStr(buckets[buckets.length - 1].end);
  const monthParam = `${year}-${pad2(month)}`;
  const basePath = `/dashboard/member/${memberId}`;

  // Setoran only — this member's contribution history. This is NOT a
  // per-person balance; the actual kas balance lives on /dashboard.
  const carryRows = (await sql`
    SELECT COALESCE(SUM(amount), 0) AS carry
    FROM transactions
    WHERE member_id = ${memberId} AND type = 'saldo' AND date < ${rangeStart}
  `) as unknown as { carry: string }[];
  const setoranSebelumnya = Number(carryRows[0]?.carry || 0);

  const txRows = (await sql`
    SELECT id, amount, description, date
    FROM transactions
    WHERE member_id = ${memberId} AND type = 'saldo'
      AND date >= ${rangeStart} AND date <= ${rangeEnd}
    ORDER BY date ASC, created_at ASC
  `) as unknown as TxRow[];

  const allTimeRows = (await sql`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM transactions
    WHERE member_id = ${memberId} AND type = 'saldo'
  `) as unknown as { total: string }[];
  const totalSetoranSepanjangWaktu = Number(allTimeRows[0]?.total || 0);

  const byBucket = new Map<number, TxRow[]>();
  for (const b of buckets) byBucket.set(b.index, []);
  for (const tx of txRows) {
    const d = parseSQLDate(toDateStr(tx.date));
    const idx = bucketIndexForDate(d, buckets);
    if (idx) byBucket.get(idx)?.push(tx);
  }

  const monthSetoran = txRows.reduce((s, t) => s + Number(t.amount), 0);

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const today = new Date().toISOString().slice(0, 10);

  let runningTotal = setoranSebelumnya;

  return (
    <div>
      <Link
        href="/dashboard"
        className="mb-4 inline-block font-body text-xs font-semibold text-ink/50 hover:text-ink"
      >
        &larr; Kembali ke Dashboard
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 font-display text-xs uppercase tracking-[0.3em] text-ledger/70">
            Riwayat Setoran
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {member.name}
          </h1>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <Link
            href={`${basePath}?month=${prev.year}-${pad2(prev.month)}`}
            className="rounded-full border border-line px-3 py-2 font-body text-xs font-semibold text-ink/60 hover:border-ledger hover:text-ledger"
          >
            &larr;
          </Link>
          <span className="min-w-[9rem] text-center font-display text-sm font-semibold text-ink">
            {MONTH_NAMES_ID[month - 1]} {year}
          </span>
          <Link
            href={`${basePath}?month=${next.year}-${pad2(next.month)}`}
            className="rounded-full border border-line px-3 py-2 font-body text-xs font-semibold text-ink/60 hover:border-ledger hover:text-ledger"
          >
            &rarr;
          </Link>
          <form method="GET" action={basePath} className="flex items-center gap-1.5">
            <input
              type="month"
              name="month"
              defaultValue={monthParam}
              className="rounded-full border border-line bg-white px-3 py-1.5 font-body text-xs text-ink outline-none focus:border-ledger"
            />
            <button
              type="submit"
              className="rounded-full bg-ink px-3 py-1.5 font-body text-xs font-semibold text-paper"
            >
              Lihat
            </button>
          </form>
        </div>
      </div>

      {/* Summary — setoran only, no balance/expense concept here */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <MiniStat
          label="Setoran Bulan Ini"
          value={formatRupiah(monthSetoran)}
          tone="ledger"
        />
        <MiniStat
          label="Setoran Bulan Sebelumnya (kumulatif)"
          value={formatRupiah(setoranSebelumnya)}
        />
        <MiniStat
          label="Total Setoran Sepanjang Waktu"
          value={formatRupiah(totalSetoranSepanjangWaktu)}
          tone="ledger"
          emphasized
        />
      </div>

      {/* Add setoran */}
      <details className="group mb-8 rounded-card border border-line bg-white/70 shadow-card">
        <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-body text-sm font-semibold text-ink">
          <span>+ Tambah Setoran</span>
          <span className="text-ink/40 transition group-open:rotate-45">+</span>
        </summary>
        <form
          action={addSetoranAction}
          className="grid grid-cols-1 gap-4 border-t border-line px-6 py-5 md:grid-cols-4"
        >
          <input type="hidden" name="member_id" value={member.id} />
          <input
            type="hidden"
            name="redirect_to"
            value={`${basePath}?month=${monthParam}`}
          />

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

          <div className="md:col-span-4">
            <SubmitButton className="rounded-full bg-ledger px-6 py-2.5 text-sm font-semibold text-paper transition hover:bg-ledger-dark disabled:opacity-60">
              Simpan
            </SubmitButton>
          </div>
        </form>
      </details>

      {/* Weekly setoran breakdown */}
      <div className="space-y-5">
        {buckets.map((b: WeekBucket) => {
          const txs = byBucket.get(b.index) || [];
          const weekSetoran = txs.reduce((s, t) => s + Number(t.amount), 0);
          runningTotal += weekSetoran;

          return (
            <div
              key={b.index}
              className="overflow-hidden rounded-card border border-line bg-white/70 shadow-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paperDark/60 px-5 py-3">
                <div>
                  <span className="font-display text-sm font-semibold text-ink">
                    Minggu {b.index}
                  </span>
                  <span className="ml-2 font-body text-xs text-ink/50">
                    {formatDateRange(b.start, b.end)}
                  </span>
                </div>
                <div className="flex items-center gap-4 font-body text-xs">
                  <span className="text-ledger-dark">
                    +{formatRupiah(weekSetoran)}
                  </span>
                  <span className="rounded-full bg-ink px-3 py-1 font-semibold text-paper tabular">
                    Total {formatRupiah(runningTotal)}
                  </span>
                </div>
              </div>

              {txs.length === 0 ? (
                <p className="px-5 py-5 font-body text-sm text-ink/40">
                  Tidak ada setoran minggu ini.
                </p>
              ) : (
                <table className="w-full font-body text-sm">
                  <tbody>
                    {txs.map((t) => (
                      <tr key={t.id} className="border-b border-line last:border-0">
                        <td className="w-24 px-5 py-2.5 text-xs text-ink/50">
                          {formatDateShort(parseSQLDate(toDateStr(t.date)))}
                        </td>
                        <td className="px-2 py-2.5 text-ink/70">
                          {t.description || (
                            <span className="text-ink/30">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular font-semibold text-ledger-dark">
                          +{formatRupiah(t.amount)}
                        </td>
                        <td className="w-16 px-5 py-2.5 text-right">
                          <form action={deleteTransactionAction}>
                            <input type="hidden" name="id" value={t.id} />
                            <input
                              type="hidden"
                              name="member_id"
                              value={member.id}
                            />
                            <input
                              type="hidden"
                              name="redirect_to"
                              value={`${basePath}?month=${monthParam}`}
                            />
                            <ConfirmSubmitButton
                              confirmMessage="Hapus setoran ini?"
                              className="font-body text-xs font-semibold text-ink/40 hover:text-rose"
                            >
                              Hapus
                            </ConfirmSubmitButton>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({
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
