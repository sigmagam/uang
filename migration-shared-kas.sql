-- Run this ONCE in your Neon SQL editor if you already had the old
-- per-member-balance version deployed, to migrate to the shared-kas model.
-- Safe to run even on an empty database.

-- 1. Allow pengeluaran (expenses) to have no member attached, since they now
--    come out of one shared pool instead of a specific person's balance.
ALTER TABLE transactions ALTER COLUMN member_id DROP NOT NULL;

-- 2. Existing pengeluaran rows were tied to a member before; detach them so
--    they behave as pooled/shared expenses going forward.
UPDATE transactions SET member_id = NULL WHERE type = 'pengeluaran';

-- 3. Enforce going forward: saldo (setoran) must have a member, pengeluaran must not.
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_member_matches_type;
ALTER TABLE transactions ADD CONSTRAINT chk_member_matches_type CHECK (
  (type = 'saldo' AND member_id IS NOT NULL) OR
  (type = 'pengeluaran' AND member_id IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_transactions_type_date ON transactions (type, date);
