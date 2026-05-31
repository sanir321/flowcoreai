-- Fix match_kb_chunks function: the `<=>` operator inside the function body
-- failed to resolve because the vector type reference was stale.
-- Recreating the function forces fresh operator resolution against pgvector 0.8.0.
create or replace function match_kb_chunks(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  p_workspace_id uuid default null
)
returns table(id uuid, content text, similarity float)
language plpgsql
as $$
begin
  return query
  select kc.id, kc.content, 1 - (kc.embedding <=> query_embedding) as similarity
  from public.kb_chunks kc
  join public.kb_sources ks on ks.id = kc.source_id
  where (p_workspace_id is null or kc.workspace_id = p_workspace_id)
    and kc.deleted_at is null
    and ks.deleted_at is null
    and ks.status = 'active'
    and (kc.embedding <=> query_embedding) < 1 - match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
end;
$$;
