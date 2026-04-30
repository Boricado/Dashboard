alter table public.health_inbody_scans
  add column if not exists file_name text,
  add column if not exists file_path text,
  add column if not exists file_mime_type text,
  add column if not exists file_size bigint;

insert into storage.buckets (id, name, public)
values ('health-inbody-files', 'health-inbody-files', false)
on conflict (id) do nothing;

drop policy if exists "health_inbody_files_select_own" on storage.objects;
create policy "health_inbody_files_select_own"
on storage.objects
for select
using (
  bucket_id = 'health-inbody-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "health_inbody_files_insert_own" on storage.objects;
create policy "health_inbody_files_insert_own"
on storage.objects
for insert
with check (
  bucket_id = 'health-inbody-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "health_inbody_files_update_own" on storage.objects;
create policy "health_inbody_files_update_own"
on storage.objects
for update
using (
  bucket_id = 'health-inbody-files'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'health-inbody-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "health_inbody_files_delete_own" on storage.objects;
create policy "health_inbody_files_delete_own"
on storage.objects
for delete
using (
  bucket_id = 'health-inbody-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);
