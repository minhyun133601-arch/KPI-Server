-- purpose: add production-sheet time metrics to util production daily entries.
-- rollback_note: keep the columns unless the migration has not reached shared data; otherwise restore from a pre-change snapshot instead of dropping accepted data.
-- recovery_note: rerun `npm run db:migrate` after restoring the database snapshot so the structured production table has the expected columns.

alter table if exists util_production_daily_entries
  add column if not exists input_time numeric null,
  add column if not exists operation_time numeric null;
