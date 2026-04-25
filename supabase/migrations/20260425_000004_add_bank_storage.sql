alter table public.bank_transactions
  add column if not exists file_path text,
  add column if not exists file_mime_type text,
  add column if not exists file_size bigint;

insert into storage.buckets (id, name, public)
values ('bank-documents', 'bank-documents', false)
on conflict (id) do nothing;

drop policy if exists "bank_documents_select_own" on storage.objects;
create policy "bank_documents_select_own"
on storage.objects
for select
using (
  bucket_id = 'bank-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "bank_documents_insert_own" on storage.objects;
create policy "bank_documents_insert_own"
on storage.objects
for insert
with check (
  bucket_id = 'bank-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "bank_documents_update_own" on storage.objects;
create policy "bank_documents_update_own"
on storage.objects
for update
using (
  bucket_id = 'bank-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'bank-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "bank_documents_delete_own" on storage.objects;
create policy "bank_documents_delete_own"
on storage.objects
for delete
using (
  bucket_id = 'bank-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);
