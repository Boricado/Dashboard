create table if not exists public.licitaciones (
  id uuid primary key default gen_random_uuid(),
  codigo_licitacion text not null,
  titulo text not null,
  descripcion text,
  monto_estimado bigint,
  moneda text,
  region text,
  estado_api text,
  codigo_estado text,
  fecha_publicacion timestamptz,
  fecha_cierre timestamptz,
  organismo text,
  comprador text,
  categoria text,
  url text,
  source_payload jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint licitaciones_codigo_unique unique (codigo_licitacion),
  constraint licitaciones_titulo_not_blank check (char_length(trim(titulo)) > 0)
);

create table if not exists public.licitacion_tracking (
  id uuid primary key default gen_random_uuid(),
  licitacion_id uuid not null references public.licitaciones(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stage text not null default 'sin_revisar',
  priority text not null default 'media',
  next_step text,
  notes text,
  follow_up_at timestamptz,
  is_favorite boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint licitacion_tracking_stage_check check (
    stage in ('sin_revisar', 'revisando', 'postular', 'seguimiento', 'descartada')
  ),
  constraint licitacion_tracking_priority_check check (
    priority in ('baja', 'media', 'alta')
  ),
  constraint licitacion_tracking_user_unique unique (user_id, licitacion_id)
);

create index if not exists licitaciones_fecha_cierre_idx
  on public.licitaciones (fecha_cierre asc);

create index if not exists licitaciones_region_idx
  on public.licitaciones (region, fecha_cierre asc);

create index if not exists licitaciones_estado_idx
  on public.licitaciones (estado_api, codigo_estado);

create index if not exists licitaciones_monto_idx
  on public.licitaciones (monto_estimado);

create index if not exists licitacion_tracking_user_idx
  on public.licitacion_tracking (user_id, stage, priority, follow_up_at);

alter table public.licitaciones enable row level security;
alter table public.licitacion_tracking enable row level security;

drop trigger if exists licitaciones_set_updated_at on public.licitaciones;
create trigger licitaciones_set_updated_at
before update on public.licitaciones
for each row
execute function public.set_updated_at();

drop trigger if exists licitacion_tracking_set_updated_at on public.licitacion_tracking;
create trigger licitacion_tracking_set_updated_at
before update on public.licitacion_tracking
for each row
execute function public.set_updated_at();

drop policy if exists "licitaciones_select_authenticated" on public.licitaciones;
create policy "licitaciones_select_authenticated"
on public.licitaciones
for select
using (auth.role() = 'authenticated');

drop policy if exists "licitacion_tracking_select_own" on public.licitacion_tracking;
create policy "licitacion_tracking_select_own"
on public.licitacion_tracking
for select
using (auth.uid() = user_id);

drop policy if exists "licitacion_tracking_insert_own" on public.licitacion_tracking;
create policy "licitacion_tracking_insert_own"
on public.licitacion_tracking
for insert
with check (auth.uid() = user_id);

drop policy if exists "licitacion_tracking_update_own" on public.licitacion_tracking;
create policy "licitacion_tracking_update_own"
on public.licitacion_tracking
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "licitacion_tracking_delete_own" on public.licitacion_tracking;
create policy "licitacion_tracking_delete_own"
on public.licitacion_tracking
for delete
using (auth.uid() = user_id);
