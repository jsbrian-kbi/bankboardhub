-- Supabase Storage 설정 (SQL Editor에서 실행)
-- Dashboard > Storage에서 'resources' 버킷을 public으로 생성해도 됩니다.

insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict (id) do update set public = true;

create policy "Public read uploaded resources"
on storage.objects for select
using (bucket_id = 'resources');

create policy "Admins can upload resources"
on storage.objects for insert
with check (
  bucket_id = 'resources'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "Admins can update resources"
on storage.objects for update
using (
  bucket_id = 'resources'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "Admins can delete resources"
on storage.objects for delete
using (
  bucket_id = 'resources'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
