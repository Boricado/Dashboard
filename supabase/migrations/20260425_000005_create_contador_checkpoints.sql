create table if not exists public.contador_checkpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  item_type text not null,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint contador_checkpoints_item_key_not_blank check (char_length(trim(item_key)) > 0),
  constraint contador_checkpoints_item_type_check check (
    item_type in ('monthly_tax', 'startup_task', 'annual_obligation')
  ),
  constraint contador_checkpoints_user_item_unique unique (user_id, item_key)
);

create index if not exists contador_checkpoints_user_idx
  on public.contador_checkpoints (user_id, item_type, created_at desc);

alter table public.contador_checkpoints enable row level security;

drop trigger if exists contador_checkpoints_set_updated_at on public.contador_checkpoints;
create trigger contador_checkpoints_set_updated_at
before update on public.contador_checkpoints
for each row
execute function public.set_updated_at();

drop policy if exists "contador_checkpoints_select_own" on public.contador_checkpoints;
create policy "contador_checkpoints_select_own"
on public.contador_checkpoints
for select
using (auth.uid() = user_id);

drop policy if exists "contador_checkpoints_insert_own" on public.contador_checkpoints;
create policy "contador_checkpoints_insert_own"
on public.contador_checkpoints
for insert
with check (auth.uid() = user_id);

drop policy if exists "contador_checkpoints_update_own" on public.contador_checkpoints;
create policy "contador_checkpoints_update_own"
on public.contador_checkpoints
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "contador_checkpoints_delete_own" on public.contador_checkpoints;
create policy "contador_checkpoints_delete_own"
on public.contador_checkpoints
for delete
using (auth.uid() = user_id);
