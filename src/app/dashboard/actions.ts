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
  const initialSetoran = Number(formData.get("initial_setoran") || 0);
  const dateStr = String(formData.get("initial_date") || "");

  if (!name) return;

  const rows =
    await sql`INSERT INTO members (name) VALUES (${name}) RETURNING id`;
  const memberId = rows[0]?.id;

  // optional first setoran, e.g. "setoran minggu ini"
  if (memberId && initialSetoran > 0) {
    const date = dateStr || new Date().toISOString().slice(0, 10);
    await sql`INSERT INTO transactions (member_id, type, amount, description, date)
      VALUES (${memberId}, 'saldo', ${initialSetoran}, 'Setoran awal', ${date})`;
  }

  revalidatePath("/dashboard");
}

export async function deleteMemberAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await sql`DELETE FROM members WHERE id = ${id}`;
  revalidatePath("/dashboard");
}

// Setoran = a member paying into the shared kas. Always tied to a member.
export async function addSetoranAction(formData: FormData) {
  const memberId = Number(formData.get("member_id"));
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date") || "");
  const description = String(formData.get("description") || "").trim() || null;
  const redirectTo = String(formData.get("redirect_to") || "");

  if (!memberId || !amount || amount <= 0 || !date) return;

  await sql`INSERT INTO transactions (member_id, type, amount, description, date)
    VALUES (${memberId}, 'saldo', ${amount}, ${description}, ${date})`;

  revalidatePath(`/dashboard/member/${memberId}`);
  revalidatePath("/dashboard");

  if (redirectTo) redirect(redirectTo);
}

// Pengeluaran = a shared/pooled expense. Never tied to a single member;
// it simply comes out of the one total kas balance.
export async function addPengeluaranAction(formData: FormData) {
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date") || "");
  const description = String(formData.get("description") || "").trim() || null;
  const redirectTo = String(formData.get("redirect_to") || "");

  if (!amount || amount <= 0 || !date) return;

  await sql`INSERT INTO transactions (member_id, type, amount, description, date)
    VALUES (NULL, 'pengeluaran', ${amount}, ${description}, ${date})`;

  revalidatePath("/dashboard/pengeluaran");
  revalidatePath("/dashboard");

  if (redirectTo) redirect(redirectTo);
}

export async function deleteTransactionAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const memberId = Number(formData.get("member_id") || 0);
  const redirectTo = String(formData.get("redirect_to") || "");
  const extraRevalidate = String(formData.get("revalidate_path") || "");
  if (!id) return;

  await sql`DELETE FROM transactions WHERE id = ${id}`;

  if (memberId) revalidatePath(`/dashboard/member/${memberId}`);
  if (extraRevalidate) revalidatePath(extraRevalidate);
  revalidatePath("/dashboard");

  if (redirectTo) redirect(redirectTo);
}
