"use server";

import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth";

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function addMemberAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const initialSaldo = Number(formData.get("initial_saldo") || 0);
  const dateStr = String(formData.get("initial_date") || "");

  if (!name) return;

  const rows =
    await sql`INSERT INTO members (name) VALUES (${name}) RETURNING id`;
  const memberId = rows[0]?.id;

  // optional starting saldo, e.g. "saldo awal minggu ini"
  if (memberId && initialSaldo > 0) {
    const date = dateStr || new Date().toISOString().slice(0, 10);
    await sql`INSERT INTO transactions (member_id, type, amount, description, date)
      VALUES (${memberId}, 'saldo', ${initialSaldo}, 'Saldo awal', ${date})`;
  }

  revalidatePath("/dashboard");
}

export async function deleteMemberAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await sql`DELETE FROM members WHERE id = ${id}`;
  revalidatePath("/dashboard");
}

export async function addTransactionAction(formData: FormData) {
  const memberId = Number(formData.get("member_id"));
  const type = String(formData.get("type") || "");
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date") || "");
  const description = String(formData.get("description") || "").trim() || null;
  const redirectTo = String(formData.get("redirect_to") || "");

  if (!memberId || !amount || amount <= 0 || !date) return;
  if (type !== "saldo" && type !== "pengeluaran") return;

  await sql`INSERT INTO transactions (member_id, type, amount, description, date)
    VALUES (${memberId}, ${type}, ${amount}, ${description}, ${date})`;

  revalidatePath(`/dashboard/member/${memberId}`);
  revalidatePath("/dashboard");

  if (redirectTo) redirect(redirectTo);
}

export async function deleteTransactionAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const memberId = Number(formData.get("member_id"));
  const redirectTo = String(formData.get("redirect_to") || "");
  if (!id) return;

  await sql`DELETE FROM transactions WHERE id = ${id}`;

  if (memberId) revalidatePath(`/dashboard/member/${memberId}`);
  revalidatePath("/dashboard");

  if (redirectTo) redirect(redirectTo);
}
