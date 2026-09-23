-- ─────────────────────────────────────────────────────────────────────────────
-- Analytics rollups, retention and admin reporting.
--
-- compute_daily_rollup(day) recomputes one day (in the reporting time zone,
-- default Asia/Kolkata) into public.daily_rollups. It is idempotent: pg_cron
-- runs it hourly for "today" and nightly for "yesterday". Dashboards read the
-- rollups; only the user explorer and Web Vitals percentiles read raw rows.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function private.report_tz()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (select nullif(s.data -> 'analytics' ->> 'timezone', '') from public.site_settings s limit 1),
    'Asia/Kolkata'
  )
$$;

create or replace function private.compute_daily_rollup(p_day date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz text := private.report_tz();
  v_from timestamptz := (p_day::timestamp) at time zone v_tz;
  v_to timestamptz := ((p_day + 1)::timestamp) at time zone v_tz;
  v_rows integer;
begin
  delete from public.daily_rollups where day = p_day;

  with
  s as (select * from public.sessions where started_at >= v_from and started_at < v_to),
  pv as (select * from public.page_views where created_at >= v_from and created_at < v_to),
  ev as (select * from public.events where created_at >= v_from and created_at < v_to),
  dl as (select * from public.downloads where created_at >= v_from and created_at < v_to),
  sr as (select * from public.searches where created_at >= v_from and created_at < v_to),
  au as (select * from public.auth_events where created_at >= v_from and created_at < v_to),
  fb as (select * from public.content_feedback where created_at >= v_from and created_at < v_to),
  bounce_sessions as (select id from s where page_view_count <= 1),
  funnel as (
    select
      s.id,
      exists (select 1 from pv where pv.session_id = s.id and pv.page_type = 'graded_assignment') as ga,
      exists (select 1 from ev where ev.session_id = s.id and ev.event_name = 'hint_reveal') as hint,
      exists (select 1 from ev where ev.session_id = s.id and ev.event_name = 'solution_view') as solution,
      exists (select 1 from dl where dl.session_id = s.id) as download,
      exists (select 1 from au where au.session_id = s.id and au.event_name = 'login_success') as login
    from s
  ),
  metrics (metric, dimension, value) as (
    -- Site totals
    select 'site.sessions', '', count(*)::numeric from s
    union all select 'site.visitors', '', count(distinct anonymous_id) from s
    union all select 'site.new_visitors', '', count(distinct anonymous_id) filter (where not is_returning) from s
    union all select 'site.returning_visitors', '', count(distinct anonymous_id) filter (where is_returning) from s
    union all select 'site.users', '', count(distinct user_id) from s where user_id is not null
    union all select 'site.page_views', '', count(*) from pv
    union all select 'site.avg_session_seconds', '', coalesce(round(avg(duration_seconds)), 0) from s
    union all select 'site.logins', '', count(*) from au where event_name = 'login_success'
    union all select 'site.login_failures', '', count(*) from au where event_name = 'login_failure'
    union all select 'site.signups', '', count(*) from au where event_name = 'signup_first_login'
    union all select 'site.downloads', '', count(*) from dl
    union all select 'site.searches', '', count(*) from sr
    union all select 'site.feedback', '', count(*) from fb
    union all select 'site.wau', '', count(distinct anonymous_id) from public.sessions
      where started_at >= v_to - interval '7 days' and started_at < v_to
    union all select 'site.mau', '', count(distinct anonymous_id) from public.sessions
      where started_at >= v_to - interval '28 days' and started_at < v_to
    -- Per page
    union all select 'page.views', path, count(*) from pv group by path
    union all select 'page.visitors', path, count(distinct anonymous_id) from pv group by path
    union all select 'page.engaged_seconds', path, sum(engaged_seconds) from pv group by path
    union all select 'page.engaged_views', path, count(*) filter (where engaged_seconds > 0) from pv group by path
    union all select 'page.scroll_complete', path, count(*) filter (where max_scroll >= 90) from pv group by path
    union all select 'page.entries', path, count(*) filter (where is_entry) from pv group by path
    union all select 'page.bounces', pv.path, count(*) from pv
      where pv.is_entry and pv.engaged_seconds < 10 and pv.session_id in (select id from bounce_sessions)
      group by pv.path
    union all select 'page.helpful_yes', path, count(*) filter (where helpful) from fb group by path
    union all select 'page.helpful_no', path, count(*) filter (where not helpful) from fb group by path
    union all select 'page.downloads', coalesce(page_path, ''), count(*) from dl group by page_path
    union all select 'page_type.views', coalesce(page_type, 'other'), count(*) from pv group by page_type
    -- Resources
    union all select 'resource.downloads', resource_id::text, count(*) from dl
      where resource_id is not null group by resource_id
    -- Search
    union all select 'search.queries', normalized_query, count(*) from sr group by normalized_query
    union all select 'search.zero', normalized_query, count(*) from sr
      where results_count = 0 group by normalized_query
    union all select 'search.clicks', normalized_query, count(*) from sr
      where clicked_position is not null group by normalized_query
    -- Acquisition
    union all select 'source.sessions', coalesce(traffic_source, 'direct'), count(*) from s group by traffic_source
    union all select 'organic.landings', path, count(*) from pv
      where is_entry and search_engine is not null group by path
    union all select 'device.sessions', coalesce(device_type, 'other'), count(*) from s group by device_type
    union all select 'country.sessions', coalesce(country, 'unknown'), count(*) from s group by country
    -- Funnel: independent reach and the strict nested path
    union all select 'funnel.reach.1_sessions', '', count(*) from funnel
    union all select 'funnel.reach.2_ga_view', '', count(*) filter (where ga) from funnel
    union all select 'funnel.reach.3_hint_reveal', '', count(*) filter (where hint) from funnel
    union all select 'funnel.reach.4_solution_view', '', count(*) filter (where solution) from funnel
    union all select 'funnel.reach.5_download', '', count(*) filter (where download) from funnel
    union all select 'funnel.reach.6_login', '', count(*) filter (where login) from funnel
    union all select 'funnel.nested.2_ga_view', '', count(*) filter (where ga) from funnel
    union all select 'funnel.nested.3_hint_reveal', '', count(*) filter (where ga and hint) from funnel
    union all select 'funnel.nested.4_solution_view', '', count(*) filter (where ga and hint and solution) from funnel
    union all select 'funnel.nested.5_download', '', count(*) filter (where ga and hint and solution and download) from funnel
    union all select 'funnel.nested.6_login', '', count(*) filter (where ga and hint and solution and download and login) from funnel
    -- Events by name (raw-stored events only)
    union all select 'event.count', event_name, count(*) from ev group by event_name
  )
  insert into public.daily_rollups (day, metric, dimension, value)
  select p_day, metric, coalesce(dimension, ''), value
  from metrics
  where value is not null and (value <> 0 or metric like 'site.%' or metric like 'funnel.%');

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

-- Deletes raw analytics older than the configured retention (default 13
-- months). Rollups are kept forever.
create or replace function private.purge_old_analytics()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_months integer := coalesce(
    (select nullif(s.data -> 'analytics' ->> 'retention_months', '')::integer from public.site_settings s limit 1),
    13
  );
  v_cutoff timestamptz := now() - make_interval(months => greatest(v_months, 1));
begin
  delete from public.events where created_at < v_cutoff;
  delete from public.page_views where created_at < v_cutoff;
  delete from public.downloads where created_at < v_cutoff;
  delete from public.searches where created_at < v_cutoff;
  delete from public.auth_events where created_at < v_cutoff;
  delete from public.content_feedback where created_at < v_cutoff and status <> 'new';
  delete from public.sessions where started_at < v_cutoff;
  delete from private.rate_limits where window_start < now() - interval '1 day';
end;
$$;

-- ── Admin reporting API ──────────────────────────────────────────────────────
-- All functions below raise unless the caller is an admin.

create or replace function private.assert_admin()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
end;
$$;

grant execute on function private.assert_admin() to authenticated;

-- Daily series for one metric (optionally one dimension).
create or replace function public.admin_metric_series(
  p_metric text,
  p_from date,
  p_to date,
  p_dimension text default ''
)
returns table (day date, value numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_admin();
  return query
    select d::date, coalesce(r.value, 0)
    from generate_series(p_from, p_to, interval '1 day') d
    left join public.daily_rollups r
      on r.day = d::date and r.metric = p_metric and r.dimension = coalesce(p_dimension, '')
    order by 1;
end;
$$;

-- Top dimensions of a metric summed over a range.
create or replace function public.admin_metric_top(
  p_metric text,
  p_from date,
  p_to date,
  p_limit integer default 20
)
returns table (dimension text, value numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_admin();
  return query
    select r.dimension, sum(r.value)
    from public.daily_rollups r
    where r.metric = p_metric and r.day between p_from and p_to and r.dimension <> ''
    group by r.dimension
    order by 2 desc
    limit least(greatest(p_limit, 1), 500);
end;
$$;

-- Headline numbers for the overview cards.
create or replace function public.admin_overview_totals(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz text := private.report_tz();
  v_from timestamptz := (p_from::timestamp) at time zone v_tz;
  v_to timestamptz := ((p_to + 1)::timestamp) at time zone v_tz;
  v_result jsonb;
begin
  perform private.assert_admin();
  select jsonb_build_object(
    'sessions', coalesce(sum(value) filter (where metric = 'site.sessions'), 0),
    'page_views', coalesce(sum(value) filter (where metric = 'site.page_views'), 0),
    'new_visitors', coalesce(sum(value) filter (where metric = 'site.new_visitors'), 0),
    'returning_visitors', coalesce(sum(value) filter (where metric = 'site.returning_visitors'), 0),
    'logins', coalesce(sum(value) filter (where metric = 'site.logins'), 0),
    'login_failures', coalesce(sum(value) filter (where metric = 'site.login_failures'), 0),
    'signups', coalesce(sum(value) filter (where metric = 'site.signups'), 0),
    'downloads', coalesce(sum(value) filter (where metric = 'site.downloads'), 0),
    'searches', coalesce(sum(value) filter (where metric = 'site.searches'), 0),
    'feedback', coalesce(sum(value) filter (where metric = 'site.feedback'), 0)
  )
  into v_result
  from public.daily_rollups
  where day between p_from and p_to and dimension = '';

  return v_result || jsonb_build_object(
    'visitors', (select count(distinct anonymous_id) from public.sessions
                 where started_at >= v_from and started_at < v_to),
    'dau', (select value from public.daily_rollups where metric = 'site.visitors' and day = p_to),
    'wau', (select value from public.daily_rollups where metric = 'site.wau' and day = p_to),
    'mau', (select value from public.daily_rollups where metric = 'site.mau' and day = p_to)
  );
end;
$$;

-- Per-page content performance over a range.
create or replace function public.admin_content_performance(p_from date, p_to date, p_limit integer default 500)
returns table (
  path text,
  page_type text,
  title text,
  views numeric,
  visitors numeric,
  avg_engaged_seconds numeric,
  scroll_completion numeric,
  bounce_rate numeric,
  helpful_yes numeric,
  helpful_no numeric,
  downloads numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_admin();
  return query
    with agg as (
      select
        r.dimension as path,
        sum(r.value) filter (where r.metric = 'page.views') as views,
        sum(r.value) filter (where r.metric = 'page.visitors') as visitors,
        sum(r.value) filter (where r.metric = 'page.engaged_seconds') as engaged_seconds,
        sum(r.value) filter (where r.metric = 'page.engaged_views') as engaged_views,
        sum(r.value) filter (where r.metric = 'page.scroll_complete') as scroll_complete,
        sum(r.value) filter (where r.metric = 'page.entries') as entries,
        sum(r.value) filter (where r.metric = 'page.bounces') as bounces,
        sum(r.value) filter (where r.metric = 'page.helpful_yes') as helpful_yes,
        sum(r.value) filter (where r.metric = 'page.helpful_no') as helpful_no,
        sum(r.value) filter (where r.metric = 'page.downloads') as downloads
      from public.daily_rollups r
      where r.day between p_from and p_to and r.metric like 'page.%' and r.dimension <> ''
      group by r.dimension
    )
    select
      a.path,
      meta.page_type,
      meta.title,
      coalesce(a.views, 0),
      coalesce(a.visitors, 0),
      round(coalesce(a.engaged_seconds / nullif(a.engaged_views, 0), 0), 1),
      round(coalesce(a.scroll_complete / nullif(a.views, 0), 0), 3),
      round(coalesce(a.bounces / nullif(a.entries, 0), 0), 3),
      coalesce(a.helpful_yes, 0),
      coalesce(a.helpful_no, 0),
      coalesce(a.downloads, 0)
    from agg a
    left join lateral (
      select pv.page_type, pv.title
      from public.page_views pv
      where pv.path = a.path
      order by pv.created_at desc
      limit 1
    ) meta on true
    order by coalesce(a.views, 0) desc
    limit least(greatest(p_limit, 1), 5000);
end;
$$;

-- Week-over-week movers: current window vs the previous window of equal size.
create or replace function public.admin_movers(p_days integer default 7, p_limit integer default 10)
returns table (path text, current_views numeric, previous_views numeric, change numeric, change_pct numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone private.report_tz())::date;
  v_cur_from date := v_today - p_days + 1;
  v_prev_from date := v_today - 2 * p_days + 1;
  v_prev_to date := v_today - p_days;
begin
  perform private.assert_admin();
  return query
    with cur as (
      select dimension, sum(value) v from public.daily_rollups
      where metric = 'page.views' and day between v_cur_from and v_today group by dimension
    ),
    prev as (
      select dimension, sum(value) v from public.daily_rollups
      where metric = 'page.views' and day between v_prev_from and v_prev_to group by dimension
    ),
    joined as (
      select
        coalesce(cur.dimension, prev.dimension) as path,
        coalesce(cur.v, 0) as cv,
        coalesce(prev.v, 0) as pv
      from cur full join prev on prev.dimension = cur.dimension
    )
    (select j.path, j.cv, j.pv, j.cv - j.pv, round((j.cv - j.pv) / nullif(j.pv, 0), 3)
     from joined j where j.cv - j.pv > 0 order by j.cv - j.pv desc limit p_limit)
    union all
    (select j.path, j.cv, j.pv, j.cv - j.pv, round((j.cv - j.pv) / nullif(j.pv, 0), 3)
     from joined j where j.cv - j.pv < 0 order by j.cv - j.pv asc limit p_limit);
end;
$$;

-- p75 Web Vitals per page template, from raw page views.
create or replace function public.admin_web_vitals(p_from date, p_to date)
returns table (page_type text, samples bigint, lcp_p75 numeric, cls_p75 numeric, inp_p75 numeric, ttfb_p75 numeric, fcp_p75 numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz text := private.report_tz();
begin
  perform private.assert_admin();
  return query
    select
      coalesce(pv.page_type, 'other'),
      count(*),
      round(percentile_cont(0.75) within group (order by pv.lcp)::numeric, 0),
      round(percentile_cont(0.75) within group (order by pv.cls)::numeric, 3),
      round(percentile_cont(0.75) within group (order by pv.inp)::numeric, 0),
      round(percentile_cont(0.75) within group (order by pv.ttfb)::numeric, 0),
      round(percentile_cont(0.75) within group (order by pv.fcp)::numeric, 0)
    from public.page_views pv
    where pv.created_at >= (p_from::timestamp) at time zone v_tz
      and pv.created_at < ((p_to + 1)::timestamp) at time zone v_tz
      and (pv.lcp is not null or pv.cls is not null or pv.inp is not null or pv.ttfb is not null)
    group by 1
    order by 2 desc;
end;
$$;

-- Chronological activity for one user (only detailed-consent data is linked).
create or replace function public.admin_user_timeline(
  p_user_id uuid,
  p_before timestamptz default null,
  p_limit integer default 200
)
returns table (occurred_at timestamptz, kind text, name text, path text, detail jsonb)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_before timestamptz := coalesce(p_before, now() + interval '1 minute');
  v_limit integer := least(greatest(p_limit, 1), 1000);
begin
  perform private.assert_admin();
  return query
    select * from (
      select e.created_at, 'event'::text, e.event_name, e.path, e.properties
        from public.events e where e.user_id = p_user_id and e.created_at < v_before
      union all
      select pv.created_at, 'page_view', coalesce(pv.page_type, 'page'), pv.path,
             jsonb_build_object('engaged_seconds', pv.engaged_seconds, 'max_scroll', pv.max_scroll, 'title', pv.title)
        from public.page_views pv where pv.user_id = p_user_id and pv.created_at < v_before
      union all
      select d.created_at, 'download', coalesce(r.title, 'resource'), d.page_path,
             jsonb_build_object('resource_id', d.resource_id, 'file_type', d.file_type)
        from public.downloads d left join public.resources r on r.id = d.resource_id
        where d.user_id = p_user_id and d.created_at < v_before
      union all
      select s.created_at, 'search', s.query, s.clicked_path,
             jsonb_build_object('results', s.results_count, 'clicked_position', s.clicked_position)
        from public.searches s where s.user_id = p_user_id and s.created_at < v_before
      union all
      select a.created_at, 'auth', a.event_name, null, jsonb_build_object('provider', a.provider, 'reason', a.reason)
        from public.auth_events a where a.user_id = p_user_id and a.created_at < v_before
    ) t
    order by 1 desc
    limit v_limit;
end;
$$;

-- Lets an admin recompute rollups on demand (e.g. after a backfill).
create or replace function public.admin_refresh_rollups(p_from date, p_to date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  d date;
  v_total integer := 0;
begin
  perform private.assert_admin();
  if p_to - p_from > 400 then
    raise exception 'Range too large (max 400 days)';
  end if;
  for d in select generate_series(p_from, p_to, interval '1 day')::date loop
    v_total := v_total + private.compute_daily_rollup(d);
  end loop;
  return v_total;
end;
$$;

grant execute on function public.admin_metric_series(text, date, date, text) to authenticated;
grant execute on function public.admin_metric_top(text, date, date, integer) to authenticated;
grant execute on function public.admin_overview_totals(date, date) to authenticated;
grant execute on function public.admin_content_performance(date, date, integer) to authenticated;
grant execute on function public.admin_movers(integer, integer) to authenticated;
grant execute on function public.admin_web_vitals(date, date) to authenticated;
grant execute on function public.admin_user_timeline(uuid, timestamptz, integer) to authenticated;
grant execute on function public.admin_refresh_rollups(date, date) to authenticated;
