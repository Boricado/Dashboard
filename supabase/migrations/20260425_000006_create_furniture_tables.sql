create table if not exists public.furniture_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_key text not null,
  category text not null,
  name text not null,
  unit_label text not null default 'unidad',
  unit_price bigint not null default 0,
  reference text,
  supplier text,
  note text,
  source_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint furniture_materials_material_key_not_blank check (char_length(trim(material_key)) > 0),
  constraint furniture_materials_name_not_blank check (char_length(trim(name)) > 0),
  constraint furniture_materials_user_key_unique unique (user_id, material_key)
);

create table if not exists public.furniture_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  labor_cost bigint not null default 0,
  sale_price bigint not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint furniture_projects_name_not_blank check (char_length(trim(name)) > 0)
);

create table if not exists public.furniture_project_materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.furniture_projects(id) on delete cascade,
  material_id uuid not null references public.furniture_materials(id) on delete restrict,
  quantity numeric(12,2) not null default 1,
  unit_price_snapshot bigint not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists furniture_materials_user_idx
  on public.furniture_materials (user_id, category, created_at desc);

create index if not exists furniture_projects_user_idx
  on public.furniture_projects (user_id, created_at desc);

create index if not exists furniture_project_materials_project_idx
  on public.furniture_project_materials (project_id, created_at desc);

alter table public.furniture_materials enable row level security;
alter table public.furniture_projects enable row level security;
alter table public.furniture_project_materials enable row level security;

drop trigger if exists furniture_materials_set_updated_at on public.furniture_materials;
create trigger furniture_materials_set_updated_at
before update on public.furniture_materials
for each row
execute function public.set_updated_at();

drop trigger if exists furniture_projects_set_updated_at on public.furniture_projects;
create trigger furniture_projects_set_updated_at
before update on public.furniture_projects
for each row
execute function public.set_updated_at();

drop trigger if exists furniture_project_materials_set_updated_at on public.furniture_project_materials;
create trigger furniture_project_materials_set_updated_at
before update on public.furniture_project_materials
for each row
execute function public.set_updated_at();

drop policy if exists "furniture_materials_select_own" on public.furniture_materials;
create policy "furniture_materials_select_own"
on public.furniture_materials
for select
using (auth.uid() = user_id);

drop policy if exists "furniture_materials_insert_own" on public.furniture_materials;
create policy "furniture_materials_insert_own"
on public.furniture_materials
for insert
with check (auth.uid() = user_id);

drop policy if exists "furniture_materials_update_own" on public.furniture_materials;
create policy "furniture_materials_update_own"
on public.furniture_materials
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "furniture_materials_delete_own" on public.furniture_materials;
create policy "furniture_materials_delete_own"
on public.furniture_materials
for delete
using (auth.uid() = user_id);

drop policy if exists "furniture_projects_select_own" on public.furniture_projects;
create policy "furniture_projects_select_own"
on public.furniture_projects
for select
using (auth.uid() = user_id);

drop policy if exists "furniture_projects_insert_own" on public.furniture_projects;
create policy "furniture_projects_insert_own"
on public.furniture_projects
for insert
with check (auth.uid() = user_id);

drop policy if exists "furniture_projects_update_own" on public.furniture_projects;
create policy "furniture_projects_update_own"
on public.furniture_projects
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "furniture_projects_delete_own" on public.furniture_projects;
create policy "furniture_projects_delete_own"
on public.furniture_projects
for delete
using (auth.uid() = user_id);

drop policy if exists "furniture_project_materials_select_own" on public.furniture_project_materials;
create policy "furniture_project_materials_select_own"
on public.furniture_project_materials
for select
using (
  exists (
    select 1
    from public.furniture_projects
    where furniture_projects.id = furniture_project_materials.project_id
      and furniture_projects.user_id = auth.uid()
  )
);

drop policy if exists "furniture_project_materials_insert_own" on public.furniture_project_materials;
create policy "furniture_project_materials_insert_own"
on public.furniture_project_materials
for insert
with check (
  exists (
    select 1
    from public.furniture_projects
    where furniture_projects.id = furniture_project_materials.project_id
      and furniture_projects.user_id = auth.uid()
  )
);

drop policy if exists "furniture_project_materials_update_own" on public.furniture_project_materials;
create policy "furniture_project_materials_update_own"
on public.furniture_project_materials
for update
using (
  exists (
    select 1
    from public.furniture_projects
    where furniture_projects.id = furniture_project_materials.project_id
      and furniture_projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.furniture_projects
    where furniture_projects.id = furniture_project_materials.project_id
      and furniture_projects.user_id = auth.uid()
  )
);

drop policy if exists "furniture_project_materials_delete_own" on public.furniture_project_materials;
create policy "furniture_project_materials_delete_own"
on public.furniture_project_materials
for delete
using (
  exists (
    select 1
    from public.furniture_projects
    where furniture_projects.id = furniture_project_materials.project_id
      and furniture_projects.user_id = auth.uid()
  )
);
