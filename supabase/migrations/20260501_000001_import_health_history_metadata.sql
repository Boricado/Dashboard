alter table public.health_workout_sessions
  add column if not exists week_label text,
  add column if not exists external_id text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'health_workout_sessions_user_source_external_unique'
  ) then
    alter table public.health_workout_sessions
      add constraint health_workout_sessions_user_source_external_unique
      unique (user_id, source, external_id);
  end if;
end;
$$;

create index if not exists health_workout_sessions_user_source_idx
  on public.health_workout_sessions (user_id, source, session_date desc);
