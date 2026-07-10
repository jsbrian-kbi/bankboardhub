create extension if not exists pg_trgm;
create extension if not exists unaccent;

create type public.user_role as enum ('user', 'admin');

create table if not exists public.profiles (
  id uuid primary key,
  email text unique not null,
  full_name text not null,
  role public.user_role not null default 'user',
  organization text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id bigserial primary key,
  domain text not null,
  name text not null,
  slug text not null unique
);

create table if not exists public.documents (
  id bigserial primary key,
  domain text not null,
  title text not null,
  body text not null,
  source_name text,
  source_url text,
  published_at date,
  is_public boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) stored
);

create table if not exists public.document_categories (
  document_id bigint references public.documents(id) on delete cascade,
  category_id bigint references public.categories(id) on delete cascade,
  primary key (document_id, category_id)
);

create table if not exists public.banks (
  id bigserial primary key,
  name text not null unique,
  board_size int,
  outside_director_count int,
  committee_summary jsonb,
  female_ratio numeric(5,2),
  expertise_summary jsonb,
  term_status text,
  updated_at timestamptz not null default now()
);

create table if not exists public.education_programs (
  id bigserial primary key,
  title text not null,
  track text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  application_deadline timestamptz,
  capacity int,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_cases (
  id bigserial primary key,
  institution text not null,
  summary text not null,
  findings text not null,
  sanction text,
  implications text,
  issued_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.precedents (
  id bigserial primary key,
  case_name text not null,
  case_number text,
  court text,
  judgment_date date,
  issue text,
  decision_summary text,
  implication text,
  checkpoint text,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_search_vector on public.documents using gin(search_vector);

create or replace function public.search_documents(keyword text, match_count int default 20)
returns table (
  id bigint,
  domain text,
  title text,
  snippet text,
  rank real
)
language sql
as $$
  select
    d.id,
    d.domain,
    d.title,
    left(d.body, 220) as snippet,
    ts_rank(d.search_vector, plainto_tsquery('simple', keyword)) as rank
  from public.documents d
  where d.search_vector @@ plainto_tsquery('simple', keyword)
  order by rank desc
  limit match_count;
$$;

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.banks enable row level security;
alter table public.education_programs enable row level security;
alter table public.regulatory_cases enable row level security;
alter table public.precedents enable row level security;

create policy "Public can read public documents"
on public.documents for select
using (is_public = true);
