create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.health_inbody_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scan_date date not null,
  source_label text,
  height_cm integer,
  age integer,
  weight_kg numeric(6,2) not null,
  body_water_l numeric(6,2),
  proteins_kg numeric(6,2),
  minerals_kg numeric(6,2),
  body_fat_mass_kg numeric(6,2),
  skeletal_muscle_kg numeric(6,2),
  body_fat_percent numeric(5,2),
  bmi numeric(5,2),
  score integer,
  target_weight_kg numeric(6,2),
  weight_control_kg numeric(6,2),
  fat_control_kg numeric(6,2),
  muscle_control_kg numeric(6,2),
  waist_hip_ratio numeric(5,2),
  visceral_fat_level integer,
  obesity_degree numeric(6,2),
  basal_metabolic_rate_kcal integer,
  fat_free_mass_kg numeric(6,2),
  ime_kg_m2 numeric(5,2),
  recommended_intake_kcal integer,
  segmental_lean jsonb not null default '{}'::jsonb,
  segmental_fat jsonb not null default '{}'::jsonb,
  impedance jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint health_inbody_scans_user_date_unique unique (user_id, scan_date)
);

create table if not exists public.health_routine_weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_code text not null,
  label text not null,
  focus text,
  status_label text,
  is_template boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint health_routine_weeks_user_code_unique unique (user_id, week_code)
);

create table if not exists public.health_routine_days (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.health_routine_weeks(id) on delete cascade,
  day_index smallint not null,
  day_short text not null,
  day_name text not null,
  session_name text not null,
  status text not null default 'upcoming',
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint health_routine_days_status_check
    check (status in ('completed', 'today', 'upcoming', 'rest')),
  constraint health_routine_days_week_day_unique unique (week_id, day_index)
);

create table if not exists public.health_workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_week_id uuid references public.health_routine_weeks(id) on delete set null,
  routine_day_id uuid references public.health_routine_days(id) on delete set null,
  session_date date not null,
  session_type text not null,
  status text not null default 'pendiente',
  notes text,
  source text not null default 'manual',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint health_workout_sessions_status_check
    check (status in ('completado', 'parcial', 'pendiente')),
  constraint health_workout_sessions_source_check
    check (source in ('manual', 'imported'))
);

create table if not exists public.health_workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.health_workout_sessions(id) on delete cascade,
  sort_order integer not null default 0,
  name text not null,
  sets_text text,
  reps_text text,
  load_text text,
  completed boolean not null default true,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists health_inbody_scans_user_date_idx
  on public.health_inbody_scans (user_id, scan_date desc);

create index if not exists health_routine_weeks_user_sort_idx
  on public.health_routine_weeks (user_id, sort_order, week_code);

create index if not exists health_routine_days_week_idx
  on public.health_routine_days (week_id, day_index);

create index if not exists health_workout_sessions_user_date_idx
  on public.health_workout_sessions (user_id, session_date desc);

create index if not exists health_workout_sessions_week_idx
  on public.health_workout_sessions (routine_week_id, routine_day_id);

create index if not exists health_workout_session_exercises_session_idx
  on public.health_workout_session_exercises (session_id, sort_order);

drop trigger if exists health_inbody_scans_set_updated_at on public.health_inbody_scans;
create trigger health_inbody_scans_set_updated_at
before update on public.health_inbody_scans
for each row
execute function public.set_updated_at();

drop trigger if exists health_routine_weeks_set_updated_at on public.health_routine_weeks;
create trigger health_routine_weeks_set_updated_at
before update on public.health_routine_weeks
for each row
execute function public.set_updated_at();

drop trigger if exists health_routine_days_set_updated_at on public.health_routine_days;
create trigger health_routine_days_set_updated_at
before update on public.health_routine_days
for each row
execute function public.set_updated_at();

drop trigger if exists health_workout_sessions_set_updated_at on public.health_workout_sessions;
create trigger health_workout_sessions_set_updated_at
before update on public.health_workout_sessions
for each row
execute function public.set_updated_at();

drop trigger if exists health_workout_session_exercises_set_updated_at on public.health_workout_session_exercises;
create trigger health_workout_session_exercises_set_updated_at
before update on public.health_workout_session_exercises
for each row
execute function public.set_updated_at();

alter table public.health_inbody_scans enable row level security;
alter table public.health_routine_weeks enable row level security;
alter table public.health_routine_days enable row level security;
alter table public.health_workout_sessions enable row level security;
alter table public.health_workout_session_exercises enable row level security;

drop policy if exists "health_inbody_scans_select_own" on public.health_inbody_scans;
create policy "health_inbody_scans_select_own"
on public.health_inbody_scans
for select
using (auth.uid() = user_id);

drop policy if exists "health_inbody_scans_insert_own" on public.health_inbody_scans;
create policy "health_inbody_scans_insert_own"
on public.health_inbody_scans
for insert
with check (auth.uid() = user_id);

drop policy if exists "health_inbody_scans_update_own" on public.health_inbody_scans;
create policy "health_inbody_scans_update_own"
on public.health_inbody_scans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "health_inbody_scans_delete_own" on public.health_inbody_scans;
create policy "health_inbody_scans_delete_own"
on public.health_inbody_scans
for delete
using (auth.uid() = user_id);

drop policy if exists "health_routine_weeks_select_own" on public.health_routine_weeks;
create policy "health_routine_weeks_select_own"
on public.health_routine_weeks
for select
using (auth.uid() = user_id);

drop policy if exists "health_routine_weeks_insert_own" on public.health_routine_weeks;
create policy "health_routine_weeks_insert_own"
on public.health_routine_weeks
for insert
with check (auth.uid() = user_id);

drop policy if exists "health_routine_weeks_update_own" on public.health_routine_weeks;
create policy "health_routine_weeks_update_own"
on public.health_routine_weeks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "health_routine_weeks_delete_own" on public.health_routine_weeks;
create policy "health_routine_weeks_delete_own"
on public.health_routine_weeks
for delete
using (auth.uid() = user_id);

drop policy if exists "health_routine_days_select_own" on public.health_routine_days;
create policy "health_routine_days_select_own"
on public.health_routine_days
for select
using (
  exists (
    select 1
    from public.health_routine_weeks w
    where w.id = week_id
      and w.user_id = auth.uid()
  )
);

drop policy if exists "health_routine_days_insert_own" on public.health_routine_days;
create policy "health_routine_days_insert_own"
on public.health_routine_days
for insert
with check (
  exists (
    select 1
    from public.health_routine_weeks w
    where w.id = week_id
      and w.user_id = auth.uid()
  )
);

drop policy if exists "health_routine_days_update_own" on public.health_routine_days;
create policy "health_routine_days_update_own"
on public.health_routine_days
for update
using (
  exists (
    select 1
    from public.health_routine_weeks w
    where w.id = week_id
      and w.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.health_routine_weeks w
    where w.id = week_id
      and w.user_id = auth.uid()
  )
);

drop policy if exists "health_routine_days_delete_own" on public.health_routine_days;
create policy "health_routine_days_delete_own"
on public.health_routine_days
for delete
using (
  exists (
    select 1
    from public.health_routine_weeks w
    where w.id = week_id
      and w.user_id = auth.uid()
  )
);

drop policy if exists "health_workout_sessions_select_own" on public.health_workout_sessions;
create policy "health_workout_sessions_select_own"
on public.health_workout_sessions
for select
using (auth.uid() = user_id);

drop policy if exists "health_workout_sessions_insert_own" on public.health_workout_sessions;
create policy "health_workout_sessions_insert_own"
on public.health_workout_sessions
for insert
with check (auth.uid() = user_id);

drop policy if exists "health_workout_sessions_update_own" on public.health_workout_sessions;
create policy "health_workout_sessions_update_own"
on public.health_workout_sessions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "health_workout_sessions_delete_own" on public.health_workout_sessions;
create policy "health_workout_sessions_delete_own"
on public.health_workout_sessions
for delete
using (auth.uid() = user_id);

drop policy if exists "health_workout_session_exercises_select_own" on public.health_workout_session_exercises;
create policy "health_workout_session_exercises_select_own"
on public.health_workout_session_exercises
for select
using (
  exists (
    select 1
    from public.health_workout_sessions s
    where s.id = session_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "health_workout_session_exercises_insert_own" on public.health_workout_session_exercises;
create policy "health_workout_session_exercises_insert_own"
on public.health_workout_session_exercises
for insert
with check (
  exists (
    select 1
    from public.health_workout_sessions s
    where s.id = session_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "health_workout_session_exercises_update_own" on public.health_workout_session_exercises;
create policy "health_workout_session_exercises_update_own"
on public.health_workout_session_exercises
for update
using (
  exists (
    select 1
    from public.health_workout_sessions s
    where s.id = session_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.health_workout_sessions s
    where s.id = session_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "health_workout_session_exercises_delete_own" on public.health_workout_session_exercises;
create policy "health_workout_session_exercises_delete_own"
on public.health_workout_session_exercises
for delete
using (
  exists (
    select 1
    from public.health_workout_sessions s
    where s.id = session_id
      and s.user_id = auth.uid()
  )
);
