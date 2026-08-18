create table if not exists kb_nodes (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    source_id uuid references kb_sources(id) on delete cascade,
    name text not null,
    type text not null,
    description text,
    embedding vector(384),
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create index if not exists idx_kb_nodes_workspace on kb_nodes(workspace_id) where deleted_at is null;
create index if not exists idx_kb_nodes_name on kb_nodes(name) where deleted_at is null;
create index if not exists idx_kb_nodes_hnsw on kb_nodes using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);

alter table kb_nodes enable row level security;
create policy "kb_nodes_rls" on kb_nodes
    for all
    using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null) and deleted_at is null);

create table if not exists kb_edges (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    source_id uuid references kb_sources(id) on delete cascade,
    source_node_id uuid not null references kb_nodes(id) on delete cascade,
    target_node_id uuid not null references kb_nodes(id) on delete cascade,
    relation_type text not null,
    description text,
    weight float default 1.0,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    unique(source_node_id, target_node_id, relation_type)
);

create index if not exists idx_kb_edges_workspace on kb_edges(workspace_id) where deleted_at is null;
create index if not exists idx_kb_edges_source_node on kb_edges(source_node_id) where deleted_at is null;
create index if not exists idx_kb_edges_target_node on kb_edges(target_node_id) where deleted_at is null;

alter table kb_edges enable row level security;
create policy "kb_edges_rls" on kb_edges
    for all
    using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null) and deleted_at is null);

-- GraphRAG Search Function
create or replace function match_kb_graph(
    query_embedding vector(384),
    match_threshold float,
    match_count int,
    p_workspace_id uuid,
    p_tag text default null
)
returns table (
    id uuid,
    name text,
    type text,
    description text,
    similarity float,
    edges jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    with closest_nodes as (
        select 
            n.id,
            n.name,
            n.type,
            n.description,
            1 - (n.embedding <=> query_embedding) as similarity
        from public.kb_nodes n
        where n.workspace_id = p_workspace_id
          and n.deleted_at is null
          and (p_tag is null or n.metadata->>'tag' = p_tag)
          and 1 - (n.embedding <=> query_embedding) > match_threshold
        order by n.embedding <=> query_embedding
        limit match_count
    )
    select 
        cn.id,
        cn.name,
        cn.type,
        cn.description,
        cn.similarity,
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'relation', e.relation_type,
                    'target', tn.name,
                    'target_type', tn.type,
                    'description', e.description
                )
            ) filter (where e.id is not null),
            '[]'::jsonb
        ) as edges
    from closest_nodes cn
    left join public.kb_edges e on (e.source_node_id = cn.id or e.target_node_id = cn.id) and e.deleted_at is null
    left join public.kb_nodes tn on (tn.id = case when e.source_node_id = cn.id then e.target_node_id else e.source_node_id end)
    group by cn.id, cn.name, cn.type, cn.description, cn.similarity
    order by cn.similarity desc;
end;
$$;

-- Overload match_kb_chunks for Hybrid Search + Tag Filtering
create or replace function match_kb_chunks(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  p_workspace_id uuid default null,
  p_query_text text default null,
  p_tag text default null
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
    and (p_tag is null or kc.metadata->>'tag' = p_tag)
    and (kc.embedding <=> query_embedding) < 1 - match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
end;
$$;
