create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid)
from cron.job
where jobname = 'sync-licitaciones-coquimbo';

select cron.schedule(
  'sync-licitaciones-coquimbo',
  '30 11 * * 1-5',
  $$
  select
    net.http_post(
      url := 'https://pcwyckcjuwcwgjuyyfgg.functions.supabase.co/sync-licitaciones-coquimbo',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := '{"source":"pg_cron"}'::jsonb
    );
  $$
);

-- 30 11 * * 1-5 corresponde a 07:30 America/Santiago el 25 de abril de 2026,
-- cuando Chile continental esta en UTC-4.
-- Si quieres que siga fijo a las 07:30 despues de un cambio de horario estacional,
-- toca ajustar manualmente esta expresion cron.
