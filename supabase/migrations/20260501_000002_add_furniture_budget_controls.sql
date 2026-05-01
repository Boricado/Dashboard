alter table public.furniture_projects
  add column if not exists waste_percent numeric(5,2) not null default 10,
  add column if not exists target_margin_percent numeric(5,2) not null default 35;
