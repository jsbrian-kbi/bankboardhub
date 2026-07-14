-- Supabase Storage 설정 (SQL Editor에서 실행)
-- Dashboard > Storage에서 'resources' 버킷을 public으로 생성해도 됩니다.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resources',
  'resources',
  true,
  52428800, -- 50MB
  null
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "Public read uploaded resources" on storage.objects;
create policy "Public read uploaded resources"
on storage.objects for select
using (bucket_id = 'resources');

drop policy if exists "Admins can upload resources" on storage.objects;
create policy "Admins can upload resources"
on storage.objects for insert
with check (
  bucket_id = 'resources'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "Admins can update resources" on storage.objects;
create policy "Admins can update resources"
on storage.objects for update
using (
  bucket_id = 'resources'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "Admins can delete resources" on storage.objects;
create policy "Admins can delete resources"
on storage.objects for delete
using (
  bucket_id = 'resources'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- 참고: 서버(service role) 업로드와 createSignedUploadUrl은 RLS를 우회합니다.
-- 브라우저의 서명 URL PUT 업로드는 토큰으로 동작합니다.
