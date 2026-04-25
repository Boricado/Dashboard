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

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  company_name text,
  currency text not null default 'CLP',
  initial_balance bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bank_accounts_name_not_blank check (char_length(trim(name)) > 0)
);

create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.bank_accounts(id) on delete cascade,
  transaction_date date not null,
  type text not null,
  category text not null,
  provider text,
  description text,
  document_number text,
  net_amount bigint not null default 0,
  vat_amount bigint not null default 0,
  total_amount bigint not null default 0,
  file_name text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bank_transactions_type_check check (type in ('ingreso', 'gasto')),
  constraint bank_transactions_category_not_blank check (char_length(trim(category)) > 0)
);

create index if not exists bank_accounts_user_idx
  on public.bank_accounts (user_id, created_at desc);

create index if not exists bank_transactions_user_date_idx
  on public.bank_transactions (user_id, transaction_date desc, created_at desc);

create index if not exists bank_transactions_account_idx
  on public.bank_transactions (account_id, transaction_date desc);

create index if not exists bank_transactions_type_idx
  on public.bank_transactions (type);

alter table public.bank_accounts enable row level security;
alter table public.bank_transactions enable row level security;

drop trigger if exists bank_accounts_set_updated_at on public.bank_accounts;
create trigger bank_accounts_set_updated_at
before update on public.bank_accounts
for each row
execute function public.set_updated_at();

drop trigger if exists bank_transactions_set_updated_at on public.bank_transactions;
create trigger bank_transactions_set_updated_at
before update on public.bank_transactions
for each row
execute function public.set_updated_at();

drop policy if exists "bank_accounts_select_own" on public.bank_accounts;
create policy "bank_accounts_select_own"
on public.bank_accounts
for select
using (auth.uid() = user_id);

drop policy if exists "bank_accounts_insert_own" on public.bank_accounts;
create policy "bank_accounts_insert_own"
on public.bank_accounts
for insert
with check (auth.uid() = user_id);

drop policy if exists "bank_accounts_update_own" on public.bank_accounts;
create policy "bank_accounts_update_own"
on public.bank_accounts
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "bank_accounts_delete_own" on public.bank_accounts;
create policy "bank_accounts_delete_own"
on public.bank_accounts
for delete
using (auth.uid() = user_id);

drop policy if exists "bank_transactions_select_own" on public.bank_transactions;
create policy "bank_transactions_select_own"
on public.bank_transactions
for select
using (auth.uid() = user_id);

drop policy if exists "bank_transactions_insert_own" on public.bank_transactions;
create policy "bank_transactions_insert_own"
on public.bank_transactions
for insert
with check (auth.uid() = user_id);

drop policy if exists "bank_transactions_update_own" on public.bank_transactions;
create policy "bank_transactions_update_own"
on public.bank_transactions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "bank_transactions_delete_own" on public.bank_transactions;
create policy "bank_transactions_delete_own"
on public.bank_transactions
for delete
using (auth.uid() = user_id);
