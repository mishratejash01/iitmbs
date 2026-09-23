-- ─────────────────────────────────────────────────────────────────────────────
-- Cross-course week hubs: /<programme>/week-<n> lists every course's week-n
-- notes and graded assignments ("iitm week 1 graded assignment" searches).
-- That URL shares a shape with /<programme>/<course>, so a course slug may
-- never look like "week-<n>".
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.courses
  add constraint courses_slug_not_week check (slug !~ '^week-[0-9]+$');

-- Adds the hubs to the route manifest (weeks that exist in any live course of
-- the programme) and to the sitemap/link index when at least one of those
-- weeks has content.
create or replace view private.live_program_weeks
with (security_invoker = true)
as
select
  lc.program_id,
  lc.program_slug,
  lw.week_number,
  '/' || lc.program_slug || '/week-' || lw.week_number as path,
  bool_or(lw.has_content) as has_content,
  max(lw.updated_at) as updated_at
from private.live_weeks lw
join private.live_courses lc on lc.id = lw.course_id
group by lc.program_id, lc.program_slug, lw.week_number;

grant select on private.live_program_weeks to anon, authenticated, service_role;

create or replace function public.get_program_week_numbers()
returns table (program_slug text, week_number smallint, has_content boolean, updated_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select lpw.program_slug::text, lpw.week_number, lpw.has_content, lpw.updated_at
  from private.live_program_weeks lpw
  order by 1, 2
$$;

revoke execute on function public.get_program_week_numbers() from public;
grant execute on function public.get_program_week_numbers() to anon, authenticated, service_role;

-- Sitemap: include programme week hubs that have content.
create or replace function public.get_sitemap_entries()
returns table (section text, path text, last_modified timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select 'programs', '/' || p.slug, p.updated_at
  from public.programs p
  where private.is_live(p.is_published, p.published_at, p.deleted_at) and not p.noindex
  union all
  select 'programs', lpw.path, lpw.updated_at
  from private.live_program_weeks lpw where lpw.has_content
  union all
  select 'courses', lc.path, lc.updated_at
  from private.live_courses lc where not lc.noindex
  union all
  select 'weeks', lw.path, lw.updated_at
  from private.live_weeks lw where not lw.noindex and lw.has_content
  union all
  select 'assignments', la.path, la.updated_at
  from private.live_assignments la where not la.noindex
  union all
  select 'notes', ln.path, ln.updated_at
  from private.live_notes ln where not ln.noindex
  union all
  select 'pages', '/' || pg.path, pg.updated_at
  from public.pages pg
  where private.is_live(pg.is_published, pg.published_at, pg.deleted_at) and not pg.noindex
$$;

-- Link index: include the programme week hubs.
create or replace function public.get_link_index()
returns table (path text, title text, summary text, kind text)
language sql
stable
security invoker
set search_path = ''
as $$
  select '/' || p.slug, p.name, p.description, 'program'
  from public.programs p
  where private.is_live(p.is_published, p.published_at, p.deleted_at)
  union all
  select lpw.path, p.short_name || ' Week ' || lpw.week_number || ' — all courses', null::text, 'program_week'
  from private.live_program_weeks lpw
  join public.programs p on p.id = lpw.program_id
  union all
  select lc.path, lc.name, lc.description, 'course'
  from private.live_courses lc
  union all
  select lw.path, lc.short_name || ' Week ' || lw.week_number || ': ' || lw.title, lw.summary, 'week'
  from private.live_weeks lw
  join private.live_courses lc on lc.id = lw.course_id
  union all
  select la.path,
         lc.short_name || ' Week ' || la.week_number || ' ' ||
           case la.type when 'graded' then 'Graded Assignment' else 'Practice Assignment' end ||
           case when la.is_latest then '' else ' (' || la.term || ')' end,
         la.summary, 'assignment'
  from private.live_assignments la
  join private.live_courses lc on lc.id = la.course_id
  union all
  select ln.path, ln.title, ln.summary, 'note'
  from private.live_notes ln
  union all
  select '/' || pg.path, pg.title, pg.summary, 'page'
  from public.pages pg
  where private.is_live(pg.is_published, pg.published_at, pg.deleted_at)
$$;

-- Route manifest: add programme week hubs.
create or replace function public.get_route_manifest()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'generated_at', now(),
    -- Canonical programme slugs → their canonical course slugs.
    'programs', coalesce((
      select jsonb_object_agg(p.slug, coalesce((
        select jsonb_agg(lc.slug order by lc.slug) from private.live_courses lc where lc.program_id = p.id
      ), '[]'::jsonb))
      from public.programs p
      where private.is_live(p.is_published, p.published_at, p.deleted_at)
    ), '{}'::jsonb),
    -- Programme slug → week numbers with a cross-course hub (/<programme>/week-<n>).
    'program_weeks', coalesce((
      select jsonb_object_agg(x.program_slug, x.weeks) from (
        select lpw.program_slug, jsonb_agg(lpw.week_number order by lpw.week_number) as weeks
        from private.live_program_weeks lpw group by lpw.program_slug
      ) x
    ), '{}'::jsonb),
    -- "<programme>/<course>" → what exists beneath it.
    'courses', coalesce((
      select jsonb_object_agg(lc.program_slug || '/' || lc.slug, jsonb_build_object(
        'weeks', coalesce((select jsonb_agg(lw.week_number order by lw.week_number)
                           from private.live_weeks lw where lw.course_id = lc.id), '[]'::jsonb),
        'graded', coalesce((select jsonb_object_agg(x.week_number, x.terms) from (
                   select la.week_number, jsonb_agg(la.term order by la.term) as terms
                   from private.live_assignments la where la.course_id = lc.id and la.type = 'graded'
                   group by la.week_number) x), '{}'::jsonb),
        'practice', coalesce((select jsonb_object_agg(x.week_number, x.terms) from (
                   select la.week_number, jsonb_agg(la.term order by la.term) as terms
                   from private.live_assignments la where la.course_id = lc.id and la.type = 'practice'
                   group by la.week_number) x), '{}'::jsonb),
        'week_notes', coalesce((select jsonb_agg(ln.week_number order by ln.week_number)
                                from private.live_notes ln where ln.course_id = lc.id and ln.kind = 'week'), '[]'::jsonb),
        'notes', coalesce((select jsonb_agg(ln.slug order by ln.slug)
                           from private.live_notes ln where ln.course_id = lc.id and ln.kind = 'topic'), '[]'::jsonb),
        'formula_sheet', exists (select 1 from private.live_notes ln where ln.course_id = lc.id and ln.kind = 'formula_sheet'),
        'exam_prep', exists (select 1 from private.live_notes ln where ln.course_id = lc.id and ln.kind = 'exam_prep')
          or exists (select 1 from public.assignments a where a.course_id = lc.id and a.week_id is null
                     and private.is_live(a.is_published, a.published_at, a.deleted_at))
      ))
      from private.live_courses lc
    ), '{}'::jsonb),
    -- Alias slugs → canonical slugs.
    'program_aliases', coalesce((
      select jsonb_object_agg(x.alias, x.slug) from (
        select distinct on (private.slugify(a)) private.slugify(a) as alias, p.slug::text as slug
        from public.programs p, unnest(p.aliases) a
        where private.is_live(p.is_published, p.published_at, p.deleted_at)
          and private.slugify(a) <> '' and private.slugify(a) <> p.slug
      ) x
    ), '{}'::jsonb),
    'course_aliases', coalesce((
      select jsonb_object_agg(x.key, x.target) from (
        select distinct on (lc.program_slug, private.slugify(a))
          lc.program_slug || '/' || private.slugify(a) as key,
          lc.path as target
        from private.live_courses lc, unnest(lc.aliases) a
        where private.slugify(a) <> '' and private.slugify(a) <> lc.slug
      ) x
    ), '{}'::jsonb),
    -- Cross-listed "<programme>/<course>" → canonical course path.
    'cross_listed', coalesce((
      select jsonb_object_agg(p.slug || '/' || lc.slug, lc.path)
      from public.course_programs cp
      join public.programs p on p.id = cp.program_id
      join private.live_courses lc on lc.id = cp.course_id
      where private.is_live(p.is_published, p.published_at, p.deleted_at)
        and cp.program_id <> lc.program_id
    ), '{}'::jsonb),
    'pages', coalesce((
      select jsonb_agg(pg.path order by pg.path) from public.pages pg
      where private.is_live(pg.is_published, pg.published_at, pg.deleted_at)
    ), '[]'::jsonb),
    'redirects', coalesce((
      select jsonb_object_agg(r.from_path, jsonb_build_array(r.to_path, r.status_code))
      from public.redirects r where r.is_active
    ), '{}'::jsonb)
  )
$$;

