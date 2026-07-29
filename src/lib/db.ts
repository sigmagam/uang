import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set. Add it to .env.local (or your Vercel project env vars)."
  );
}

// Tagged-template SQL client. Usage: await sql`SELECT * FROM members WHERE id = ${id}`
export const sql = neon(process.env.DATABASE_URL || "");
