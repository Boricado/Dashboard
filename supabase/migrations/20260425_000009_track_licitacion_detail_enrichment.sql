alter table public.licitaciones
  add column if not exists detail_last_attempt_at timestamptz,
  add column if not exists detail_last_enriched_at timestamptz,
  add column if not exists detail_attempt_count integer not null default 0;

create index if not exists licitaciones_detail_attempt_idx
  on public.licitaciones (detail_last_attempt_at asc nulls first, fecha_cierre asc nulls last);
