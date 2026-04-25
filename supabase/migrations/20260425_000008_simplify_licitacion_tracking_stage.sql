alter table public.licitacion_tracking
  drop constraint if exists licitacion_tracking_stage_check;

alter table public.licitacion_tracking
  add constraint licitacion_tracking_stage_check
  check (
    stage in ('sin_revisar', 'revisada', 'postulada', 'descartada')
  );
