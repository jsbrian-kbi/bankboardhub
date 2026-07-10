-- RBAC + RLS hardening for Bank Board Governance Hub

alter table public.categories enable row level security;
alter table public.document_categories enable row level security;

-- profiles
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Admins can manage profiles"
on public.profiles for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- documents
create policy "Admins can manage documents"
on public.documents for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- banks
create policy "Public can read banks"
on public.banks for select
using (true);

create policy "Admins can manage banks"
on public.banks for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- education programs
create policy "Public can read education"
on public.education_programs for select
using (true);

create policy "Admins can manage education"
on public.education_programs for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- regulatory cases
create policy "Public can read regulatory cases"
on public.regulatory_cases for select
using (true);

create policy "Admins can manage regulatory cases"
on public.regulatory_cases for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- precedents
create policy "Public can read precedents"
on public.precedents for select
using (true);

create policy "Admins can manage precedents"
on public.precedents for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- optional helper: promote specific user to admin after signup
-- update public.profiles set role = 'admin' where email = 'admin@example.com';
