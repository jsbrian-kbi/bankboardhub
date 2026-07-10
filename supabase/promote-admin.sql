-- 관리자 접속 문제 해결용 (Supabase SQL Editor에서 실행)
-- 1) YOUR_EMAIL@example.com 을 실제 가입 이메일로 바꾸세요.
-- 2) auth.users.id 와 profiles.id 가 다르면 fix-profile-id-mismatch.sql 도 실행하세요.
-- 3) RLS 오류가 있으면 fix-rls-recursion.sql 도 실행하세요.

-- 1) 현재 상태 확인
select
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.full_name
from auth.users u
left join public.profiles p on p.id = u.id
where u.email = 'jsbrian@gmail.com';

-- 2) profiles가 없으면 auth.users 기준으로 생성
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'user'
from auth.users u
where u.email = 'jsbrian@gmail.com'
on conflict (id) do update
set email = excluded.email;

-- 3) admin 승격
update public.profiles
set role = 'admin'
where email = 'jsbrian@gmail.com';

-- 4) 최종 확인 (role = admin 이어야 함)
select email, role, created_at
from public.profiles
where email = 'jsbrian@gmail.com';
