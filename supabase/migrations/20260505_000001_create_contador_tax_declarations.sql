create table if not exists public.contador_tax_declarations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  declaration_type text not null default 'f29',
  period_year integer not null,
  period_month smallint not null,
  folio text,
  presented_at date,
  movement_status text not null default 'sin_movimientos',
  net_sales bigint not null default 0,
  vat_debit bigint not null default 0,
  vat_credit bigint not null default 0,
  previous_credit bigint not null default 0,
  total_credit bigint not null default 0,
  iva_credit_to_carry bigint not null default 0,
  amount_paid bigint not null default 0,
  sii_codes jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint contador_tax_declarations_type_check check (declaration_type in ('f29')),
  constraint contador_tax_declarations_month_check check (period_month between 1 and 12),
  constraint contador_tax_declarations_movement_check check (
    movement_status in ('sin_movimientos', 'con_movimientos')
  ),
  constraint contador_tax_declarations_unique_period unique (
    user_id,
    declaration_type,
    period_year,
    period_month
  )
);

create index if not exists contador_tax_declarations_user_period_idx
  on public.contador_tax_declarations (user_id, period_year desc, period_month desc);

alter table public.contador_tax_declarations enable row level security;

drop trigger if exists contador_tax_declarations_set_updated_at
  on public.contador_tax_declarations;
create trigger contador_tax_declarations_set_updated_at
before update on public.contador_tax_declarations
for each row
execute function public.set_updated_at();

drop policy if exists "contador_tax_declarations_select_own"
  on public.contador_tax_declarations;
create policy "contador_tax_declarations_select_own"
on public.contador_tax_declarations
for select
using (auth.uid() = user_id);

drop policy if exists "contador_tax_declarations_insert_own"
  on public.contador_tax_declarations;
create policy "contador_tax_declarations_insert_own"
on public.contador_tax_declarations
for insert
with check (auth.uid() = user_id);

drop policy if exists "contador_tax_declarations_update_own"
  on public.contador_tax_declarations;
create policy "contador_tax_declarations_update_own"
on public.contador_tax_declarations
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "contador_tax_declarations_delete_own"
  on public.contador_tax_declarations;
create policy "contador_tax_declarations_delete_own"
on public.contador_tax_declarations
for delete
using (auth.uid() = user_id);
