-- Run this once in your Neon SQL editor (or via psql) to set up the database.
--
-- Model: ONE shared kas (cash pool), not a per-member balance.
--   - "saldo" transactions = weekly setoran (dues) from a member -> always has member_id.
--   - "pengeluaran" transactions = shared/pooled expenses -> member_id is always NULL,
--     they just reduce the single shared total.
-- Total Saldo Kas = SUM(saldo) - SUM(pengeluaran), across everyone, in one number.

CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('saldo', 'pengeluaran')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_member_matches_type CHECK (
    (type = 'saldo' AND member_id IS NOT NULL) OR
    (type = 'pengeluaran' AND member_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_transactions_member_date ON transactions (member_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_type_date ON transactions (type, date);
