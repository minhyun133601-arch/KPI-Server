-- rollback_note: keep production_kind if any post-change production imports were accepted; otherwise restore from the pre-change snapshot instead of dropping data.
-- recovery_note: rerun `npm run db:migrate` after restoring the database snapshot so util_production_daily_entries exposes production_kind.

alter table if exists util_production_daily_entries
  add column if not exists production_kind text not null default 'normal';

update util_production_daily_entries
   set production_kind = 'normal'
 where production_kind is null
    or btrim(production_kind) = '';
