-- ─────────────────────────────────────────────────────────────────────────────
-- Publishing hooks: keep the statically generated site in sync with the DB.
--
-- 1. Any write to a content/config table POSTs {tables:[...]} to the site's
--    /api/revalidate endpoint (via pg_net, after commit), which revalidates the
--    matching cache tags. This covers edits made outside the admin UI too
--    (SQL editor, imports).
-- 2. revalidate_scheduled_content() — run every minute by pg_cron — pings the
--    same endpoint when scheduled content goes live or when an assignment's
--    solutions_release_at passes, so walkthroughs appear on time.
--
-- The endpoint URL and shared secret live in Supabase Vault, never in SQL:
--   select vault.create_secret('https://<site>/api/revalidate', 'site_revalidate_url');
--   select vault.create_secret('<REVALIDATE_SECRET>', 'revalidate_secret');
-- Until both exist the hooks are silent no-ops.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_net with schema extensions;

create table private.revalidation_state (
  id boolean primary key default true check (id),
  last_scheduled_check timestamptz not null default now()
);
insert into private.revalidation_state default values;

create or replace function private.post_revalidation(p_tables text[], p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select ds.decrypted_secret into v_url
  from vault.decrypted_secrets ds where ds.name = 'site_revalidate_url' limit 1;
  select ds.decrypted_secret into v_secret
  from vault.decrypted_secrets ds where ds.name = 'revalidate_secret' limit 1;

  if v_url is null or v_secret is null or cardinality(p_tables) = 0 then
    return;
  end if;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('tables', to_jsonb(p_tables), 'reason', p_reason),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    timeout_milliseconds := 5000
  );
end;
$$;

create or replace function private.notify_content_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('app.counter_update', true) = 'on' then
    return null;
  end if;
  perform private.post_revalidation(array[tg_table_name::text], 'db:' || lower(tg_op));
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'programs', 'courses', 'course_programs', 'weeks', 'assignments', 'questions', 'notes', 'resources',
    'faqs', 'pages', 'authors', 'media', 'site_settings', 'nav_items', 'footer_links', 'redirects',
    'seo_overrides'
  ]
  loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each statement execute function private.notify_content_change()',
      t || '_revalidate', t);
  end loop;
end;
$$;

-- Finds content whose publish time or solution release time passed since the
-- previous check and asks the site to revalidate the affected tables.
create or replace function private.revalidate_scheduled_content()
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_since timestamptz;
  v_now timestamptz := now();
  v_tables text[] := '{}';
begin
  select last_scheduled_check into v_since from private.revalidation_state where id for update;

  if exists (select 1 from public.programs where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'programs';
  end if;
  if exists (select 1 from public.courses where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'courses';
  end if;
  if exists (select 1 from public.weeks where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'weeks';
  end if;
  if exists (
    select 1 from public.assignments
    where is_published and deleted_at is null
      and ((published_at > v_since and published_at <= v_now)
        or (solutions_release_at > v_since and solutions_release_at <= v_now))
  ) then
    v_tables := v_tables || array['assignments', 'questions'];
  end if;
  if exists (select 1 from public.notes where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'notes';
  end if;
  if exists (select 1 from public.resources where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'resources';
  end if;
  if exists (select 1 from public.faqs where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'faqs';
  end if;
  if exists (select 1 from public.pages where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'pages';
  end if;

  update private.revalidation_state set last_scheduled_check = v_now where id;

  if cardinality(v_tables) > 0 then
    perform private.post_revalidation(v_tables, 'schedule');
  end if;
  return v_tables;
end;
$$;
