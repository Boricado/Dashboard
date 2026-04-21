create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.tasks (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  descripcion text,
  estado text not null default 'pendiente',
  prioridad text not null default 'media',
  categoria text,
  fecha_limite date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tasks_titulo_not_blank check (char_length(trim(titulo)) > 0),
  constraint tasks_estado_check check (
    estado in ('pendiente', 'en_progreso', 'completada', 'cancelada')
  ),
  constraint tasks_prioridad_check check (
    prioridad in ('baja', 'media', 'alta', 'urgente')
  )
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_estado_idx on public.tasks (estado);
create index if not exists tasks_prioridad_idx on public.tasks (prioridad);
create index if not exists tasks_fecha_limite_idx on public.tasks (fecha_limite);
create index if not exists tasks_created_at_idx on public.tasks (created_at desc);

alter table public.tasks enable row level security;

drop policy if exists "Users can view their own tasks" on public.tasks;
create policy "Users can view their own tasks"
on public.tasks
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own tasks" on public.tasks;
create policy "Users can insert their own tasks"
on public.tasks
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks"
on public.tasks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks"
on public.tasks
for delete
using (auth.uid() = user_id);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();
