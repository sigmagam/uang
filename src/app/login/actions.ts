"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  const validUsername = process.env.ADMIN_USERNAME;
  const validHash = process.env.ADMIN_PASSWORD_HASH;

  if (!validUsername || !validHash) {
    return {
      error:
        "Kredensial admin belum diatur di server (ADMIN_USERNAME / ADMIN_PASSWORD_HASH).",
    };
  }

  if (!username || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  if (username !== validUsername) {
    return { error: "Username atau password salah." };
  }

  const passwordOk = await bcrypt.compare(password, validHash);
  if (!passwordOk) {
    return { error: "Username atau password salah." };
  }

  await createSession();
  redirect("/dashboard");
}
