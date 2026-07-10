-- auth.users.id 와 profiles.id 불일치 수정
-- YOUR_EMAIL@example.com 을 실제 가입 이메일로 바꾸세요.

-- 1) 현재 불일치 확인
select
  u.id as auth_id,
  p.id as profile_id,
  u.email,
  p.role,
  case when u.id = p.id then 'OK' else 'MISMATCH' end as status
from auth.users u
left join public.profiles p on p.email = u.email
where u.email = 'YOUR_EMAIL@example.com';

-- 2) 잘못된 profiles 행 삭제 (auth id와 다른 id)
delete from public.profiles p
using auth.users u
where u.email = 'YOUR_EMAIL@example.com'
  and p.email = u.email
  and p.id <> u.id;

-- 3) auth.users 기준으로 profiles 재생성 + admin 승격
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'admin'
from auth.users u
where u.email = 'YOUR_EMAIL@example.com'
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = 'admin';

-- 4) 최종 확인 (auth_id = profile_id, role = admin)
select
  u.id as auth_id,
  p.id as profile_id,
  u.email,
  p.role,
  case when u.id = p.id then 'OK' else 'MISMATCH' end as status
from auth.users u
join public.profiles p on p.id = u.id
where u.email = 'YOUR_EMAIL@example.com';
