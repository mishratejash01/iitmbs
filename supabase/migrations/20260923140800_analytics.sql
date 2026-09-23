-- ─────────────────────────────────────────────────────────────────────────────
-- First-party analytics.
--
-- Write path: browser → POST /api/track (Zod validation, allow-list, bot
-- filter, rate limit) → public.ingest_events() with the service role. The API
-- roles have NO insert/select grants on these tables; admins read them only
-- through the reporting functions in the next migration.
--
-- Privacy (DPDP Act 2023):
-- * Raw IPs are never stored — only a daily-rotating HMAC (ip_hash).
-- * "essential" consent: pseudonymous (anonymous_id only, no user_id, no city).
-- * "detailed" consent: events are linked to the signed-in user.
-- * Raw rows are purged after site_settings.analytics.retention_months
--   (default 13); daily rollups are kept.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Event catalogue ──────────────────────────────────────────────────────────
-- Documents every event and drives the /api/track allow-list, so adding an
-- event needs no code change for storage or documentation.
create table public.event_definitions (
  name text primary key check (name ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$' and length(name) <= 64),
  category text not null check (category in (
    'session', 'navigation', 'content', 'downloads', 'search', 'auth', 'engagement', 'errors', 'performance'
  )),
  description text not null check (length(description) <= 500),
  -- { "property": "type — description", ... } (documentation)
  properties jsonb not null default '{}' check (jsonb_typeof(properties) = 'object'),
  -- false: only folded into another table (e.g. heartbeats update page_views)
  store_raw boolean not null default true,
  requires_detailed_consent boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger event_definitions_touch before update on public.event_definitions
  for each row execute function private.touch_updated_at();

-- ── Sessions ─────────────────────────────────────────────────────────────────
create table public.sessions (
  id uuid primary key,
  anonymous_id uuid not null,
  user_id uuid references public.profiles (id) on delete cascade,
  consent_level text not null default 'essential' check (consent_level in ('essential', 'detailed')),
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  landing_path text,
  referrer text,
  referrer_host text,
  traffic_source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  device_type text check (device_type in ('mobile', 'tablet', 'desktop', 'other')),
  browser text,
  os text,
  screen text,
  country text,
  region text,
  city text,
  is_returning boolean not null default false,
  page_view_count integer not null default 0,
  event_count integer not null default 0,
  ip_hash text
);

create index sessions_started_at_idx on public.sessions (started_at);
create index sessions_anonymous_id_idx on public.sessions (anonymous_id);
create index sessions_user_id_idx on public.sessions (user_id) where user_id is not null;

-- ── Raw events ───────────────────────────────────────────────────────────────
create table public.events (
  id bigint generated always as identity primary key,
  event_name text not null references public.event_definitions (name) on update cascade,
  properties jsonb not null default '{}' check (
    jsonb_typeof(properties) = 'object' and octet_length(properties::text) <= 4096
  ),
  user_id uuid references public.profiles (id) on delete cascade,
  anonymous_id uuid,
  session_id uuid,
  page_view_id uuid,
  path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  device_type text,
  browser text,
  os text,
  screen text,
  country text,
  region text,
  city text,
  consent_level text not null default 'essential',
  created_at timestamptz not null default now()
);

create index events_created_at_brin on public.events using brin (created_at);
create index events_name_created_idx on public.events (event_name, created_at);
create index events_user_id_idx on public.events (user_id, created_at) where user_id is not null;
create index events_anonymous_id_idx on public.events (anonymous_id);
create index events_session_id_idx on public.events (session_id);

-- ── Page views (one row per view; engagement + Web Vitals folded in) ─────────
create table public.page_views (
  id uuid primary key,
  session_id uuid,
  anonymous_id uuid not null,
  user_id uuid references public.profiles (id) on delete cascade,
  path text not null,
  page_type text,
  entity_id uuid,
  title text,
  referrer text,
  referrer_host text,
  is_entry boolean not null default false,
  search_engine text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device_type text,
  browser text,
  os text,
  country text,
  region text,
  city text,
  engaged_seconds integer not null default 0 check (engaged_seconds >= 0),
  max_scroll smallint not null default 0 check (max_scroll between 0 and 100),
  lcp numeric,
  cls numeric,
  inp numeric,
  ttfb numeric,
  fcp numeric,
  created_at timestamptz not null default now()
);

create index page_views_created_at_idx on public.page_views (created_at);
create index page_views_path_created_idx on public.page_views (path, created_at);
create index page_views_session_id_idx on public.page_views (session_id);
create index page_views_anonymous_id_idx on public.page_views (anonymous_id);
create index page_views_user_id_idx on public.page_views (user_id) where user_id is not null;

-- ── Downloads (server-confirmed by /api/download/[id]) ───────────────────────
create table public.downloads (
  id bigint generated always as identity primary key,
  resource_id uuid references public.resources (id) on delete set null,
  user_id uuid references public.profiles (id) on delete cascade,
  anonymous_id uuid,
  session_id uuid,
  page_path text,
  file_type text,
  file_bytes bigint,
  device_type text,
  country text,
  created_at timestamptz not null default now()
);

create index downloads_created_at_idx on public.downloads (created_at);
create index downloads_resource_id_idx on public.downloads (resource_id, created_at);
create index downloads_user_id_idx on public.downloads (user_id) where user_id is not null;
create index downloads_anonymous_id_idx on public.downloads (anonymous_id);

-- ── Searches (logged server-side by the search endpoint) ─────────────────────
create table public.searches (
  id uuid primary key default gen_random_uuid(),
  query text not null check (length(query) <= 200),
  normalized_query text not null check (length(normalized_query) <= 200),
  results_count integer not null default 0,
  source text not null default 'page' check (source in ('page', 'dialog', 'api')),
  parsed jsonb not null default '{}',
  clicked_position smallint,
  clicked_path text,
  user_id uuid references public.profiles (id) on delete cascade,
  anonymous_id uuid,
  session_id uuid,
  created_at timestamptz not null default now()
);

create index searches_created_at_idx on public.searches (created_at);
create index searches_normalized_idx on public.searches (normalized_query, created_at);
create index searches_user_id_idx on public.searches (user_id) where user_id is not null;
create index searches_anonymous_id_idx on public.searches (anonymous_id);

-- ── Auth funnel ──────────────────────────────────────────────────────────────
create table public.auth_events (
  id bigint generated always as identity primary key,
  event_name text not null check (event_name in (
    'login_click', 'login_success', 'login_failure', 'logout', 'signup_first_login', 'onboarding_complete'
  )),
  provider text,
  reason text check (length(reason) <= 200),
  user_id uuid references public.profiles (id) on delete cascade,
  anonymous_id uuid,
  session_id uuid,
  created_at timestamptz not null default now()
);

create index auth_events_created_at_idx on public.auth_events (created_at);
create index auth_events_user_id_idx on public.auth_events (user_id) where user_id is not null;

-- ── "Was this helpful?" ──────────────────────────────────────────────────────
create table public.content_feedback (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  page_type text,
  entity_id uuid,
  helpful boolean not null,
  comment text check (length(comment) <= 1000),
  status text not null default 'new' check (status in ('new', 'reviewed', 'archived')),
  user_id uuid references public.profiles (id) on delete cascade,
  anonymous_id uuid,
  session_id uuid,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

create index content_feedback_path_idx on public.content_feedback (path, created_at);
create index content_feedback_status_idx on public.content_feedback (status, created_at);
create index content_feedback_user_id_idx on public.content_feedback (user_id) where user_id is not null;

-- ── Daily rollups (kept forever) ─────────────────────────────────────────────
create table public.daily_rollups (
  day date not null,
  metric text not null,
  dimension text not null default '',
  value numeric not null,
  computed_at timestamptz not null default now(),
  primary key (day, metric, dimension)
);

create index daily_rollups_metric_idx on public.daily_rollups (metric, day);

-- ── Rate limiting (fixed windows; unlogged = no WAL, fine to lose) ───────────
create unlogged table private.rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, window_start)
);

-- Returns true when the call is allowed. One atomic upsert per call.
create or replace function public.check_rate_limit(
  p_bucket text,
  p_window_seconds integer,
  p_max_hits integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  v_hits integer;
begin
  insert into private.rate_limits as r (bucket, window_start, hits)
  values (left(p_bucket, 200), v_window, 1)
  on conflict (bucket, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;
  return v_hits <= p_max_hits;
end;
$$;

-- ── Ingest ───────────────────────────────────────────────────────────────────
-- p_context: request-level fields resolved by the server (never trusted from
--   the client): session_id, anonymous_id, user_id, consent_level, device_type,
--   browser, os, screen, country, region, city, ip_hash, referrer,
--   referrer_host, traffic_source, utm_*.
-- p_events: [{ name, path, page_view_id, page_type, entity_id, title,
--   referrer, props }] — already validated by the API route.
create or replace function public.ingest_events(p_context jsonb, p_events jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_session uuid := (p_context ->> 'session_id')::uuid;
  c_anon uuid := (p_context ->> 'anonymous_id')::uuid;
  c_detailed boolean := coalesce(p_context ->> 'consent_level', 'essential') = 'detailed';
  c_user uuid := case when c_detailed then (p_context ->> 'user_id')::uuid end;
  c_city text := case when c_detailed then p_context ->> 'city' end;
  v_event jsonb;
  v_def public.event_definitions;
  v_name text;
  v_props jsonb;
  v_page_view uuid;
  v_stored integer := 0;
  v_skipped integer := 0;
  v_seconds integer;
begin
  if c_session is null or c_anon is null then
    raise exception 'session_id and anonymous_id are required';
  end if;

  -- Session upsert. Returning visitors are those whose anonymous_id already
  -- has an earlier session.
  insert into public.sessions as s (
    id, anonymous_id, user_id, consent_level, landing_path, referrer, referrer_host,
    traffic_source, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    device_type, browser, os, screen, country, region, city, ip_hash, is_returning
  )
  values (
    c_session, c_anon, c_user, case when c_detailed then 'detailed' else 'essential' end,
    p_context ->> 'landing_path', p_context ->> 'referrer', p_context ->> 'referrer_host',
    p_context ->> 'traffic_source', p_context ->> 'utm_source', p_context ->> 'utm_medium',
    p_context ->> 'utm_campaign', p_context ->> 'utm_term', p_context ->> 'utm_content',
    p_context ->> 'device_type', p_context ->> 'browser', p_context ->> 'os', p_context ->> 'screen',
    p_context ->> 'country', p_context ->> 'region', c_city, p_context ->> 'ip_hash',
    exists (select 1 from public.sessions prev where prev.anonymous_id = c_anon and prev.id <> c_session)
  )
  on conflict (id) do update set
    last_seen_at = now(),
    duration_seconds = greatest(s.duration_seconds, extract(epoch from now() - s.started_at)::integer),
    user_id = coalesce(s.user_id, excluded.user_id),
    consent_level = case when excluded.consent_level = 'detailed' then 'detailed' else s.consent_level end;

  for v_event in select * from jsonb_array_elements(coalesce(p_events, '[]'::jsonb))
  loop
    v_name := v_event ->> 'name';
    select * into v_def from public.event_definitions d where d.name = v_name and d.is_active;
    if not found or (v_def.requires_detailed_consent and not c_detailed) then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    v_props := coalesce(v_event -> 'props', '{}'::jsonb);
    v_page_view := nullif(v_event ->> 'page_view_id', '')::uuid;

    case v_name
      when 'page_view' then
        insert into public.page_views (
          id, session_id, anonymous_id, user_id, path, page_type, entity_id, title, referrer,
          referrer_host, is_entry, search_engine, utm_source, utm_medium, utm_campaign,
          device_type, browser, os, country, region, city
        )
        values (
          coalesce(v_page_view, gen_random_uuid()), c_session, c_anon, c_user,
          coalesce(v_event ->> 'path', '/'), v_event ->> 'page_type',
          nullif(v_event ->> 'entity_id', '')::uuid, left(v_event ->> 'title', 200),
          v_event ->> 'referrer', v_props ->> 'referrer_host',
          coalesce((v_props ->> 'is_entry')::boolean, false), v_props ->> 'search_engine',
          p_context ->> 'utm_source', p_context ->> 'utm_medium', p_context ->> 'utm_campaign',
          p_context ->> 'device_type', p_context ->> 'browser', p_context ->> 'os',
          p_context ->> 'country', p_context ->> 'region', c_city
        )
        on conflict (id) do nothing;
        update public.sessions set page_view_count = page_view_count + 1 where id = c_session;

      when 'time_on_page' then
        v_seconds := least(greatest(coalesce((v_props ->> 'seconds')::integer, 0), 0), 7200);
        update public.page_views
          set engaged_seconds = greatest(engaged_seconds, v_seconds)
          where id = v_page_view;

      when 'scroll_depth' then
        update public.page_views
          set max_scroll = greatest(max_scroll, least(coalesce((v_props ->> 'depth')::smallint, 0), 100::smallint))
          where id = v_page_view;

      when 'web_vital' then
        update public.page_views set
          lcp = case when v_props ->> 'metric' = 'LCP' then (v_props ->> 'value')::numeric else lcp end,
          cls = case when v_props ->> 'metric' = 'CLS' then (v_props ->> 'value')::numeric else cls end,
          inp = case when v_props ->> 'metric' = 'INP' then (v_props ->> 'value')::numeric else inp end,
          ttfb = case when v_props ->> 'metric' = 'TTFB' then (v_props ->> 'value')::numeric else ttfb end,
          fcp = case when v_props ->> 'metric' = 'FCP' then (v_props ->> 'value')::numeric else fcp end
          where id = v_page_view;

      when 'session_end' then
        update public.sessions set
          ended_at = now(),
          duration_seconds = greatest(duration_seconds, extract(epoch from now() - started_at)::integer)
          where id = c_session;

      when 'search_result_click' then
        update public.searches set
          clicked_position = coalesce(clicked_position, (v_props ->> 'position')::smallint),
          clicked_path = coalesce(clicked_path, v_props ->> 'target')
          where id = nullif(v_props ->> 'search_id', '')::uuid;

      when 'login_click', 'login_success', 'login_failure', 'logout', 'signup_first_login', 'onboarding_complete' then
        insert into public.auth_events (event_name, provider, reason, user_id, anonymous_id, session_id)
        values (
          v_name, v_props ->> 'provider', left(v_props ->> 'reason', 200),
          coalesce(c_user, case when v_name in ('login_success', 'signup_first_login', 'onboarding_complete', 'logout')
                               then (p_context ->> 'user_id')::uuid end),
          c_anon, c_session
        );

      else
        null;
    end case;

    if v_def.store_raw then
      insert into public.events (
        event_name, properties, user_id, anonymous_id, session_id, page_view_id, path, referrer,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        device_type, browser, os, screen, country, region, city, consent_level
      )
      values (
        v_name, v_props, c_user, c_anon, c_session, v_page_view, v_event ->> 'path', v_event ->> 'referrer',
        p_context ->> 'utm_source', p_context ->> 'utm_medium', p_context ->> 'utm_campaign',
        p_context ->> 'utm_term', p_context ->> 'utm_content',
        p_context ->> 'device_type', p_context ->> 'browser', p_context ->> 'os', p_context ->> 'screen',
        p_context ->> 'country', p_context ->> 'region', c_city,
        case when c_detailed then 'detailed' else 'essential' end
      );
      v_stored := v_stored + 1;
    end if;
  end loop;

  update public.sessions set
    event_count = event_count + jsonb_array_length(coalesce(p_events, '[]'::jsonb)),
    last_seen_at = now()
  where id = c_session;

  return jsonb_build_object('stored', v_stored, 'skipped', v_skipped);
end;
$$;

-- Server-confirmed download: logs the row and bumps the public counter
-- without marking the resource as edited.
create or replace function public.record_download(
  p_resource_id uuid,
  p_context jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_detailed boolean := coalesce(p_context ->> 'consent_level', 'essential') = 'detailed';
begin
  insert into public.downloads (
    resource_id, user_id, anonymous_id, session_id, page_path, file_type, file_bytes, device_type, country
  )
  select
    r.id,
    case when c_detailed then (p_context ->> 'user_id')::uuid end,
    nullif(p_context ->> 'anonymous_id', '')::uuid,
    nullif(p_context ->> 'session_id', '')::uuid,
    p_context ->> 'page_path',
    coalesce(r.file_format, r.kind::text),
    r.file_bytes,
    p_context ->> 'device_type',
    p_context ->> 'country'
  from public.resources r
  where r.id = p_resource_id;

  perform set_config('app.counter_update', 'on', true);
  update public.resources set download_count = download_count + 1 where id = p_resource_id;
  perform set_config('app.counter_update', 'off', true);
end;
$$;

-- ── Access: service role writes, admins read via reporting functions ─────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'event_definitions', 'sessions', 'events', 'page_views', 'downloads', 'searches',
    'auth_events', 'content_feedback', 'daily_rollups'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end;
$$;

alter table private.rate_limits enable row level security;
grant all on private.rate_limits to service_role;

-- Admins may read everything here directly (dashboards, CSV export).
do $$
declare
  t text;
begin
  foreach t in array array[
    'event_definitions', 'sessions', 'events', 'page_views', 'downloads', 'searches',
    'auth_events', 'content_feedback', 'daily_rollups'
  ]
  loop
    execute format('grant select on public.%I to authenticated', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_admin()))',
      t || ': admins read', t);
  end loop;
end;
$$;

-- The event catalogue is documentation too: staff may read it, admins edit it.
create policy "event_definitions: staff read" on public.event_definitions
  for select to authenticated using ((select private.is_staff()));
grant insert, update on public.event_definitions to authenticated;
create policy "event_definitions: admins insert" on public.event_definitions
  for insert to authenticated with check ((select private.is_admin()));
create policy "event_definitions: admins update" on public.event_definitions
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Feedback triage by staff.
grant update (status, reviewed_at, reviewed_by) on public.content_feedback to authenticated;
create policy "content_feedback: staff read" on public.content_feedback
  for select to authenticated using ((select private.is_staff()));
create policy "content_feedback: staff triage" on public.content_feedback
  for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

-- Students can see their own feedback (data export).
create policy "content_feedback: read own" on public.content_feedback
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on function public.ingest_events(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.record_download(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.ingest_events(jsonb, jsonb) to service_role;
grant execute on function public.record_download(uuid, jsonb) to service_role;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
