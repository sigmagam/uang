import Link from "next/link";
import { sql } from "@/lib/db";
import { formatRupiah } from "@/lib/format";
import { addMemberAction, deleteMemberAction } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

interface MemberRow {
  id: number;
  name: string;
  total_saldo: string;
  total_pengeluaran: string;
}

async function getMembers(): Promise<MemberRow[]> {
  const rows = (await sql`
    SELECT
      m.id,
      m.name,
      COALESCE(SUM(CASE WHEN t.type = 'saldo' THEN t.amount ELSE 0 END), 0) AS total_saldo,
      COALESCE(SUM(CASE WHEN t.type = 'pengeluaran' THEN t.amount ELSE 0 END), 0) AS total_pengeluaran
    FROM members m
    LEFT JOIN transactions t ON t.member_id = m.id
    GROUP BY m.id, m.name
    ORDER BY m.name ASC
  `) as unknown as MemberRow[];
  return rows;
}

export default async function DashboardPage() {
  const members = await getMembers();

  const totalSaldo = members.reduce((s, m) => s + Number(m.total_saldo), 0);
  const totalPengeluaran = members.reduce(
    (s, m) => s + Number(m.total_pengeluaran),
    0
  );
  const totalSisa = totalSaldo - totalPengeluaran;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-1 font-display text-xs uppercase tracking-[0.3em] text-ledger/70">
            Ringkasan
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Dashboard Keuangan
          </h1>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Jumlah Member" value={String(members.length)} />
        <StatCard
          label="Total Saldo Masuk"
          value={formatRupiah(totalSaldo)}
          tone="ledger"
        />
        <StatCard
          label="Total Pengeluaran"
          value={formatRupiah(totalPengeluaran)}
          tone="rose"
        />
        <StatCard
          label="Sisa Saldo"
          value={formatRupiah(totalSisa)}
          tone={totalSisa >= 0 ? "ledger" : "rose"}
          emphasized
        />
      </div>

      {/* Add member */}
      <details className="group mb-8 rounded-card border border-line bg-white/70 shadow-card">
        <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-body text-sm font-semibold text-ink">
          <span>+ Tambah Member Baru</span>
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
              Nama Member
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
              Saldo Awal (opsional)
            </label>
            <input
              name="initial_saldo"
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
              Simpan Member
            </SubmitButton>
          </div>
        </form>
      </details>

      {/* Member list */}
      {members.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-white/40 px-6 py-14 text-center">
          <p className="font-display text-lg text-ink/60">
            Belum ada member
          </p>
          <p className="mt-1 font-body text-sm text-ink/40">
            Tambahkan member pertama lewat form di atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const saldo = Number(m.total_saldo);
            const pengeluaran = Number(m.total_pengeluaran);
            const sisa = saldo - pengeluaran;
            return (
              <div
                key={m.id}
                className="flex flex-col rounded-card border border-line bg-white/70 p-5 shadow-card"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-display text-lg font-semibold text-ink">
                    {m.name}
                  </h3>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      sisa >= 0 ? "bg-ledger-light" : "bg-rose"
                    }`}
                  />
                </div>

                <p className="mb-1 font-body text-xs uppercase tracking-wide text-ink/40">
                  Sisa Saldo
                </p>
                <p
                  className={`mb-4 font-display text-2xl font-semibold tabular ${
                    sisa >= 0 ? "text-ledger-dark" : "text-rose"
                  }`}
                >
                  {formatRupiah(sisa)}
                </p>

                <div className="mb-5 grid grid-cols-2 gap-3 border-t border-line pt-3 font-body text-xs">
                  <div>
                    <p className="text-ink/40">Saldo Masuk</p>
                    <p className="tabular font-semibold text-ledger-dark">
                      {formatRupiah(saldo)}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink/40">Pengeluaran</p>
                    <p className="tabular font-semibold text-rose">
                      {formatRupiah(pengeluaran)}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-2">
                  <Link
                    href={`/dashboard/member/${m.id}`}
                    className="flex-1 rounded-full bg-ink px-4 py-2 text-center font-body text-xs font-semibold text-paper transition hover:bg-ink/80"
                  >
                    Lihat Detail
                  </Link>
                  <form action={deleteMemberAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`Hapus member "${m.name}"? Semua catatan transaksinya juga akan terhapus.`}
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
