-- ─────────────────────────────────────────────────────────────────────────────
-- Logged-in student features: bookmarks, reading history and progress.
-- Every row belongs to one user and is only ever visible to that user.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  path public.url_path not null,
  title text not null check (length(title) between 1 and 200),
  entity_type text check (entity_type in ('program', 'course', 'week', 'assignment', 'note', 'page', 'resource')),
  entity_id uuid,
  created_at timestamptz not null default now(),
  unique (user_id, path)
);

create table public.reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  path public.url_path not null,
  title text not null check (length(title) between 1 and 200),
  entity_type text check (entity_type in ('program', 'course', 'week', 'assignment', 'note', 'page', 'resource')),
  entity_id uuid,
  visit_count integer not null default 1 check (visit_count > 0),
  first_visited_at timestamptz not null default now(),
  last_visited_at timestamptz not null default now(),
  unique (user_id, path)
);

create index reading_history_recent_idx on public.reading_history (user_id, last_visited_at desc);

create table public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  item_type text not null check (item_type in ('week', 'assignment', 'note')),
  item_id uuid not null,
  completed_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

-- Upserts a history row: first visit inserts, later visits bump the counter.
create or replace function public.record_reading(
  p_path text,
  p_title text,
  p_entity_type text default null,
  p_entity_id uuid default null
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.reading_history (user_id, path, title, entity_type, entity_id)
  values ((select auth.uid()), p_path, left(p_title, 200), p_entity_type, p_entity_id)
  on conflict (user_id, path) do update
    set visit_count = public.reading_history.visit_count + 1,
        last_visited_at = now(),
        title = excluded.title
$$;

do $$
declare
  t text;
begin
  foreach t in array array['bookmarks', 'reading_history', 'progress']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      t || ': read own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      t || ': insert own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated
         using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || ': update own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      t || ': delete own', t);
  end loop;
end;
$$;

grant execute on function public.record_reading(text, text, text, uuid) to authenticated;
