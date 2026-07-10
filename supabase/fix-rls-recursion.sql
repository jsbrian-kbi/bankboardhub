-- RLS 무한 재귀 방지: profiles 정책에서 is_admin() 함수 사용
-- Supabase SQL Editor에서 실행하세요.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage documents" on public.documents;
create policy "Admins can manage documents"
on public.documents for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage banks" on public.banks;
create policy "Admins can manage banks"
on public.banks for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage education" on public.education_programs;
create policy "Admins can manage education"
on public.education_programs for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage regulatory cases" on public.regulatory_cases;
create policy "Admins can manage regulatory cases"
on public.regulatory_cases for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage precedents" on public.precedents;
create policy "Admins can manage precedents"
on public.precedents for all
using (public.is_admin())
with check (public.is_admin());
