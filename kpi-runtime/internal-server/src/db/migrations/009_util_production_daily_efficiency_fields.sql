-- Adds the minimal HC production-efficiency source fields used to recompute team detail views.
-- rollback_note: keep these columns if any HC production imports were accepted; otherwise restore from the pre-change snapshot instead of dropping data.
-- recovery_note: rerun `npm run db:migrate` after restoring the database snapshot so util_production_daily_entries exposes the HC source fields.

alter table if exists util_production_daily_entries
  add column if not exists regular_workers numeric null,
  add column if not exists contract_workers numeric null,
  add column if not exists total_work_time numeric null,
  add column if not exists material_standard numeric null,
  add column if not exists material_actual numeric null,
  add column if not exists stick_ea numeric null,
  add column if not exists labor_productivity_ea numeric null;
