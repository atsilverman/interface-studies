-- Library cloud save for Interface Studies.
-- Run once in the Supabase SQL editor (free project is enough).
-- Direct table access is denied; clients load/save by workspace id only.

create table if not exists studio_libraries (
  id uuid primary key,
  payload jsonb not null,
  updated_at timestamptz not null
);

alter table studio_libraries enable row level security;

revoke all on table studio_libraries from public, anon, authenticated;

create or replace function studio_get_library(p_id uuid)
returns table (payload jsonb, updated_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select payload, updated_at
  from studio_libraries
  where id = p_id;
$$;

create or replace function studio_put_library(p_id uuid, p_payload jsonb, p_updated_at timestamptz)
returns table (payload jsonb, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_id is null or p_payload is null or p_updated_at is null then
    raise exception 'invalid library';
  end if;
  if jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid library';
  end if;
  if octet_length(p_payload::text) > 200000 then
    raise exception 'library too large';
  end if;

  insert into studio_libraries (id, payload, updated_at)
  values (p_id, p_payload, p_updated_at)
  on conflict (id) do update
    set payload = excluded.payload,
        updated_at = excluded.updated_at
    where studio_libraries.updated_at <= excluded.updated_at;

  return query
    select studio_libraries.payload, studio_libraries.updated_at
    from studio_libraries
    where studio_libraries.id = p_id;
end;
$$;

revoke all on function studio_get_library(uuid) from public;
revoke all on function studio_put_library(uuid, jsonb, timestamptz) from public;
grant execute on function studio_get_library(uuid) to anon, authenticated;
grant execute on function studio_put_library(uuid, jsonb, timestamptz) to anon, authenticated;
