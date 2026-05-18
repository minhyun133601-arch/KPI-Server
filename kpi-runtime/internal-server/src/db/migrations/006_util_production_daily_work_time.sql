-- purpose: align the first production-sheet time metric with the J-column work-time source.
-- rollback_note: keep work_time unless no production-sheet time data has been accepted; otherwise restore from a pre-change snapshot instead of dropping data.
-- recovery_note: rerun `npm run db:migrate` after restoring the database snapshot so util_production_daily_entries exposes work_time and operation_time.

do $$
begin
  if to_regclass('util_production_daily_entries') is null then
    return;
  end if;

  if exists (
    select 1
      from information_schema.columns
     where table_schema = current_schema()
       and table_name = 'util_production_daily_entries'
       and column_name = 'input_time'
  ) and not exists (
    select 1
      from information_schema.columns
     where table_schema = current_schema()
       and table_name = 'util_production_daily_entries'
       and column_name = 'work_time'
  ) then
    alter table util_production_daily_entries rename column input_time to work_time;
  end if;

  alter table util_production_daily_entries
    add column if not exists work_time numeric null,
    add column if not exists operation_time numeric null;

  if exists (
    select 1
      from information_schema.columns
     where table_schema = current_schema()
       and table_name = 'util_production_daily_entries'
       and column_name = 'input_time'
  ) then
    update util_production_daily_entries
       set work_time = coalesce(work_time, input_time)
     where work_time is null
       and input_time is not null;
  end if;
end $$;
