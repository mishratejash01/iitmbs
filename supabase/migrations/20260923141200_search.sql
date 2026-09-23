-- ─────────────────────────────────────────────────────────────────────────────
-- Site search: Postgres full-text search with a trigram fallback for typos.
--
-- private.search_index is a materialized view over live content only. Writes
-- to content tables mark it dirty; pg_cron refreshes it within a minute (and
-- staff can force a refresh after publishing). The application parses course
-- aliases, week numbers and content types out of the query ("math 1 week 2
-- ga") and passes them as filters.
-- ─────────────────────────────────────────────────────────────────────────────

create materialized view private.search_index as
with
programs as (
  select p.* from public.programs p
  where private.is_live(p.is_published, p.published_at, p.deleted_at)
),
course_rows as (
  select
    'course'::text as entity_type,
    lc.id as entity_id,
    lc.path,
    lc.name as title,
    lc.short_name || ' · ' || coalesce(lc.code, '') as subtitle,
    lc.program_slug::text,
    lc.id as course_id,
    null::smallint as week_number,
    'course'::text as kind,
    left(private.mdx_to_text(coalesce(lc.description, '') || ' ' || coalesce(lc.intro_mdx, '')), 4000) as body,
    lc.name || ' ' || lc.short_name || ' ' || coalesce(lc.code, '') || ' ' || array_to_string(lc.aliases, ' ') as heading,
    lc.updated_at
  from private.live_courses lc
),
week_rows as (
  select
    'week', lw.id, lw.path,
    lc.short_name || ' Week ' || lw.week_number || ': ' || lw.title,
    lc.name,
    lw.program_slug::text, lw.course_id, lw.week_number, 'week',
    left(private.mdx_to_text(coalesce(lw.summary, '') || ' ' || array_to_string(lw.topics, ', ') || ' ' || coalesce(lw.intro_mdx, '')), 4000),
    lw.title || ' week ' || lw.week_number || ' ' || lc.short_name || ' ' || array_to_string(lc.aliases, ' '),
    lw.updated_at
  from private.live_weeks lw
  join private.live_courses lc on lc.id = lw.course_id
  where lw.has_content
),
assignment_rows as (
  select
    'assignment', la.id, la.path,
    la.title || case when la.is_latest then '' else ' (' || la.term || ')' end,
    lc.short_name || ' · Week ' || la.week_number,
    la.program_slug::text, la.course_id, la.week_number, la.type::text,
    left(private.mdx_to_text(coalesce(la.summary, '') || ' ' || array_to_string(la.concepts, ', ') || ' ' || coalesce(la.intro_mdx, '')), 4000),
    la.title || ' week ' || la.week_number || ' ' || lc.short_name || ' ' || array_to_string(lc.aliases, ' ')
      || case la.type when 'graded' then ' graded assignment ga' else ' practice assignment pa' end,
    la.updated_at
  from private.live_assignments la
  join private.live_courses lc on lc.id = la.course_id
),
note_rows as (
  select
    'note', ln.id, ln.path,
    ln.title,
    lc.short_name || coalesce(' · Week ' || ln.week_number, '')
      || case ln.kind when 'formula_sheet' then ' · Formula sheet' when 'exam_prep' then ' · Exam prep' else ' · Notes' end,
    ln.program_slug::text, ln.course_id, ln.week_number, ln.kind::text,
    left(private.mdx_to_text(coalesce(ln.summary, '') || ' ' || ln.body_mdx), 4000),
    ln.title || ' ' || lc.short_name || ' ' || array_to_string(lc.aliases, ' ')
      || coalesce(' week ' || ln.week_number, '')
      || case ln.kind when 'formula_sheet' then ' formula sheet' when 'exam_prep' then ' qualifier exam preparation' else ' notes' end,
    ln.updated_at
  from private.live_notes ln
  join private.live_courses lc on lc.id = ln.course_id
),
page_rows as (
  select
    'page', pg.id, '/' || pg.path,
    pg.title, coalesce(pg.summary, ''),
    null::text, null::uuid, null::smallint, pg.template,
    left(private.mdx_to_text(coalesce(pg.summary, '') || ' ' || pg.body_mdx), 4000),
    pg.title,
    pg.updated_at
  from public.pages pg
  where private.is_live(pg.is_published, pg.published_at, pg.deleted_at)
    and not pg.noindex
    and pg.template <> 'legal'
),
faq_rows as (
  select
    'faq', f.id,
    coalesce(
      case f.scope
        when 'program' then (select '/' || p.slug from programs p where p.id = f.scope_id)
        when 'course' then (select lc.path from private.live_courses lc where lc.id = f.scope_id)
        when 'week' then (select lw.path from private.live_weeks lw where lw.id = f.scope_id)
        when 'assignment' then (select la.path from private.live_assignments la where la.id = f.scope_id)
        when 'page' then (select '/' || pg.path from public.pages pg where pg.id = f.scope_id
                          and private.is_live(pg.is_published, pg.published_at, pg.deleted_at))
        else '/qualifier'
      end,
      '/qualifier'
    ) || '#faq-' || f.id,
    f.question, 'FAQ',
    null::text, null::uuid, null::smallint, 'faq',
    left(private.mdx_to_text(f.answer_mdx), 4000),
    f.question,
    f.updated_at
  from public.faqs f
  where private.is_live(f.is_published, f.published_at, f.deleted_at)
),
program_rows as (
  select
    'program', p.id, '/' || p.slug,
    p.name, p.short_name,
    p.slug::text, null::uuid, null::smallint, 'program',
    left(private.mdx_to_text(coalesce(p.description, '') || ' ' || coalesce(p.intro_mdx, '')), 4000),
    p.name || ' ' || p.short_name || ' ' || array_to_string(p.aliases, ' '),
    p.updated_at
  from programs p
),
all_rows (
  entity_type, entity_id, path, title, subtitle, program_slug, course_id, week_number, kind, body, heading, updated_at
) as (
  select * from program_rows
  union all select * from course_rows
  union all select * from week_rows
  union all select * from assignment_rows
  union all select * from note_rows
  union all select * from page_rows
  union all select * from faq_rows
)
select
  entity_type,
  entity_id,
  path,
  title,
  subtitle,
  program_slug,
  course_id,
  week_number,
  kind,
  body,
  lower(private.immutable_unaccent(heading)) as heading_text,
  setweight(to_tsvector('english', coalesce(heading, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(heading, '')), 'A')
    || setweight(to_tsvector('english', coalesce(subtitle, '')), 'B')
    || setweight(to_tsvector('english', coalesce(body, '')), 'C') as document,
  updated_at
from all_rows
with data;

create unique index search_index_entity_key on private.search_index (entity_type, entity_id);
create index search_index_document_idx on private.search_index using gin (document);
create index search_index_heading_trgm_idx on private.search_index using gin (heading_text extensions.gin_trgm_ops);
create index search_index_filters_idx on private.search_index (course_id, week_number, kind);

-- ── Refresh bookkeeping ──────────────────────────────────────────────────────
create table private.search_state (
  id boolean primary key default true check (id),
  dirty boolean not null default true,
  refreshed_at timestamptz not null default '-infinity'
);
insert into private.search_state default values;

create or replace function private.mark_search_dirty()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Download counter bumps do not change searchable content.
  if current_setting('app.counter_update', true) = 'on' then
    return null;
  end if;
  update private.search_state set dirty = true where id and not dirty;
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['programs', 'courses', 'weeks', 'assignments', 'notes', 'faqs', 'pages', 'resources']
  loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each statement execute function private.mark_search_dirty()',
      t || '_search_dirty', t);
  end loop;
end;
$$;

-- Refreshes when content changed, or when scheduled content went live since
-- the last refresh. Cheap no-op otherwise; called every minute by pg_cron.
create or replace function private.refresh_search_index(p_force boolean default false)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_state private.search_state;
  v_due boolean;
begin
  select * into v_state from private.search_state where id;
  v_due := p_force or v_state.dirty or exists (
    select 1 from (
      select published_at from public.programs union all
      select published_at from public.courses union all
      select published_at from public.weeks union all
      select published_at from public.assignments union all
      select published_at from public.notes union all
      select published_at from public.faqs union all
      select published_at from public.pages
    ) s
    where s.published_at > v_state.refreshed_at and s.published_at <= now()
  );
  if not v_due then
    return false;
  end if;
  update private.search_state set dirty = false, refreshed_at = now() where id;
  refresh materialized view concurrently private.search_index;
  return true;
end;
$$;

-- Lets staff make just-published content searchable immediately.
create or replace function public.staff_refresh_search_index()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_staff() then
    raise exception 'Staff access required' using errcode = '42501';
  end if;
  return private.refresh_search_index(true);
end;
$$;

grant execute on function public.staff_refresh_search_index() to authenticated;

-- ── Query API ────────────────────────────────────────────────────────────────
-- Matches are wrapped in U+0002 … U+0003 in the snippet so the client can
-- highlight them without rendering any HTML from the database.
create or replace function public.search_content(
  p_query text,
  p_course_id uuid default null,
  p_week integer default null,
  p_kind text default null,
  p_limit integer default 20
)
returns table (
  entity_type text,
  path text,
  title text,
  subtitle text,
  kind text,
  week_number smallint,
  snippet text,
  rank real
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_raw text := lower(private.immutable_unaccent(trim(coalesce(p_query, ''))));
  v_tsq tsquery := case when v_raw = '' then null else websearch_to_tsquery('english', v_raw) end;
  v_tsq_simple tsquery := case when v_raw = '' then null else websearch_to_tsquery('simple', v_raw) end;
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 50);
begin
  return query
    select
      si.entity_type,
      si.path,
      si.title,
      si.subtitle,
      si.kind,
      si.week_number,
      case
        when v_tsq is not null and numnode(v_tsq) > 0 then
          ts_headline('english', si.body, v_tsq,
            'MaxWords=28, MinWords=12, ShortWord=2, MaxFragments=1, FragmentDelimiter=" … ", StartSel='
            || chr(2) || ', StopSel=' || chr(3))
        else left(si.body, 180)
      end,
      (
        case when v_tsq is not null then ts_rank_cd(si.document, v_tsq, 32) else 0 end
        + case when v_tsq_simple is not null then ts_rank_cd(si.document, v_tsq_simple, 32) * 0.5 else 0 end
        + case when v_raw <> '' then extensions.word_similarity(v_raw, si.heading_text) else 0 end
        -- Structured intents: pages students usually want first.
        + case si.entity_type when 'assignment' then 0.15 when 'week' then 0.1 when 'note' then 0.08 else 0 end
        + case when p_week is not null and si.week_number = p_week then 0.3 else 0 end
      )::real as rank
    from private.search_index si
    where (p_course_id is null or si.course_id = p_course_id)
      and (p_week is null or si.week_number = p_week)
      and (p_kind is null or si.kind = p_kind or si.entity_type = p_kind)
      and (
        v_raw = ''
        or (v_tsq is not null and si.document @@ v_tsq)
        or (v_tsq_simple is not null and si.document @@ v_tsq_simple)
        -- word_similarity: typo-tolerant match against the best-matching words
        or v_raw operator(extensions.<%) si.heading_text
        or si.heading_text like '%' || v_raw || '%'
      )
    order by rank desc, si.title
    limit v_limit;
end;
$$;

grant execute on function public.search_content(text, uuid, integer, text, integer) to anon, authenticated, service_role;
