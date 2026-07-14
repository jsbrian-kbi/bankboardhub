-- Vector RAG: document chunks + semantic search
-- Run in Supabase SQL Editor after schema.sql
-- Requires: Database → Extensions → vector (pgvector) enabled

create extension if not exists vector;

create table if not exists public.document_chunks (
  id bigserial primary key,
  document_id bigint not null references public.documents(id) on delete cascade,
  domain text not null,
  source_kind text not null check (source_kind in ('static', 'dynamic')),
  chunk_index int not null,
  content text not null,
  embedding vector(1536) not null,
  published_at date,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists idx_document_chunks_document_id
  on public.document_chunks (document_id);

create index if not exists idx_document_chunks_source_kind
  on public.document_chunks (source_kind);

create index if not exists idx_document_chunks_domain
  on public.document_chunks (domain);

-- IVFFlat is optional; cosine distance works without it for small corpora.
-- Uncomment after ~1000+ chunks for better performance:
-- create index if not exists idx_document_chunks_embedding
--   on public.document_chunks
--   using ivfflat (embedding vector_cosine_ops)
--   with (lists = 100);

alter table public.document_chunks enable row level security;

drop policy if exists "Public can read chunks of public documents" on public.document_chunks;
create policy "Public can read chunks of public documents"
on public.document_chunks for select
using (
  exists (
    select 1
    from public.documents d
    where d.id = document_chunks.document_id
      and d.is_public = true
  )
);

-- Semantic match with optional source_kind / domain filters.
-- Freshness: dynamic docs get a mild boost when published recently.
create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_count int default 8,
  filter_source_kind text default null,
  filter_domains text[] default null
)
returns table (
  chunk_id bigint,
  document_id bigint,
  domain text,
  source_kind text,
  title text,
  content text,
  published_at date,
  similarity real,
  score real
)
language sql
stable
as $$
  select
    c.id as chunk_id,
    c.document_id,
    c.domain,
    c.source_kind,
    d.title,
    c.content,
    coalesce(c.published_at, d.published_at) as published_at,
    (1 - (c.embedding <=> query_embedding))::real as similarity,
    (
      (1 - (c.embedding <=> query_embedding))
      * case
          when c.source_kind = 'dynamic' then
            greatest(
              0.55,
              1 - least(
                extract(epoch from (now() - coalesce(c.published_at, d.published_at, d.created_at)::timestamptz))
                  / (365.0 * 24 * 3600),
                1
              ) * 0.45
            )
          else 1.0
        end
    )::real as score
  from public.document_chunks c
  join public.documents d on d.id = c.document_id
  where d.is_public = true
    and (filter_source_kind is null or c.source_kind = filter_source_kind)
    and (filter_domains is null or cardinality(filter_domains) = 0 or c.domain = any(filter_domains))
  order by score desc
  limit greatest(match_count, 1);
$$;

grant execute on function public.match_document_chunks(vector, int, text, text[]) to anon, authenticated, service_role;
