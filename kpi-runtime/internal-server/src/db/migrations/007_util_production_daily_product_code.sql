-- Adds optional production item code from production sheets (D column).
-- rollback_note: keep product_code if any post-change production imports were accepted; otherwise restore from the pre-change snapshot instead of dropping data.
-- recovery_note: rerun `npm run db:migrate` after restoring the database snapshot so util_production_daily_entries exposes product_code.

alter table if exists util_production_daily_entries
  add column if not exists product_code text not null default '';
