-- Add comprehensive exercise data per routine day
-- Each routine day has its own set of planned exercises with weights, reps, etc.

create table if not exists public.health_routine_day_exercises (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.health_routine_days(id) on delete cascade,
  sort_order smallint not null default 0,
  letter text not null,
  name text not null,
  muscle text not null,
  sets text,
  reps text,
  load_text text,
  load_prev text,
  badge text,
  rest text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Per-day metadata (alerts, warmups, cardio config, focus text)
create table if not exists public.health_routine_day_meta (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.health_routine_days(id) on delete cascade,
  focus_text text,
  alert_type text,
  alert_text text,
  warmup_data jsonb not null default '[]'::jsonb,
  cardio_data jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint health_routine_day_meta_day_unique unique (day_id)
);

drop trigger if exists health_routine_day_exercises_set_updated_at on public.health_routine_day_exercises;
create trigger health_routine_day_exercises_set_updated_at
before update on public.health_routine_day_exercises
for each row
execute function public.set_updated_at();

drop trigger if exists health_routine_day_meta_set_updated_at on public.health_routine_day_meta;
create trigger health_routine_day_meta_set_updated_at
before update on public.health_routine_day_meta
for each row
execute function public.set_updated_at();

create index if not exists health_routine_day_exercises_day_idx
  on public.health_routine_day_exercises (day_id, sort_order);

create index if not exists health_routine_day_meta_day_idx
  on public.health_routine_day_meta (day_id);
