-- ─────────────────────────────────────────────────────────────────────────────
-- Routing: the single source of truth for public URLs.
--
--   /<programme>                                         programme hub
--   /<programme>/<course>                                course hub
--   /<programme>/<course>/week-<n>                       week hub
--   /<programme>/<course>/week-<n>/graded-assignment     latest term's GA
--   /<programme>/<course>/week-<n>/graded-assignment/<term>   older terms
--   /<programme>/<course>/week-<n>/practice-assignment[/<term>]
--   /<programme>/<course>/week-<n>/notes                 the week's notes
--   /<programme>/<course>/notes/<slug>                   topic notes
--   /<programme>/<course>/formula-sheet
--   /<programme>/<course>/qualifier-exam-prep
--   /<page path>                                         CMS pages
--
-- get_route_manifest() feeds the edge proxy (real 404s, alias and database
-- redirects). get_sitemap_entries() feeds the XML sitemaps. Both only expose
-- live content, and both apply the same "thin page" rule: a week hub with no
-- live notes, assignments or resources is not indexable.
-- ─────────────────────────────────────────────────────────────────────────────

-- Orders terms chronologically: 2026-jan < 2026-may < 2026-sep < 2027-jan.
create or replace function private.term_sort_key(p_term text)
returns integer
language sql
immutable
parallel safe
set search_path = ''
as $$
  select split_part(p_term, '-', 1)::integer * 10
    + case split_part(p_term, '-', 2) when 'jan' then 1 when 'may' then 2 when 'sep' then 3 else 0 end
$$;

-- Lowercase, hyphenated slug from free text ("Maths 1" → "maths-1").
create or replace function private.slugify(p_text text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(lower(private.immutable_unaccent(coalesce(p_text, ''))), '[^a-z0-9]+', '-', 'g'))
$$;

grant execute on function private.term_sort_key(text) to anon, authenticated, service_role;
grant execute on function private.slugify(text) to anon, authenticated, service_role;

-- Live courses with their live canonical programme.
create or replace view private.live_courses
with (security_invoker = true)
as
select
  c.*,
  p.slug as program_slug,
  '/' || p.slug || '/' || c.slug as path
from public.courses c
join public.programs p on p.id = c.program_id
where private.is_live(c.is_published, c.published_at, c.deleted_at)
  and private.is_live(p.is_published, p.published_at, p.deleted_at);

-- Live weeks with their path and whether they have any live content.
create or replace view private.live_weeks
with (security_invoker = true)
as
select
  w.*,
  lc.program_slug,
  lc.slug as course_slug,
  lc.path || '/week-' || w.week_number as path,
  (
    exists (select 1 from public.notes n where n.week_id = w.id
            and private.is_live(n.is_published, n.published_at, n.deleted_at))
    or exists (select 1 from public.assignments a where a.week_id = w.id
               and private.is_live(a.is_published, a.published_at, a.deleted_at))
    or exists (select 1 from public.resources r where r.week_id = w.id
               and private.is_live(r.is_published, r.published_at, r.deleted_at))
  ) as has_content
from public.weeks w
join private.live_courses lc on lc.id = w.course_id
where private.is_live(w.is_published, w.published_at, w.deleted_at);

-- Live week-level graded/practice assignments with canonical paths. The latest
-- term of each (week, type) lives at the base path; older terms at /<term>.
create or replace view private.live_assignments
with (security_invoker = true)
as
select
  a.*,
  lw.program_slug,
  lw.course_slug,
  lw.week_number,
  lw.path as week_path,
  case a.type when 'graded' then 'graded-assignment' else 'practice-assignment' end as route_segment,
  rank() over (partition by a.week_id, a.type order by private.term_sort_key(a.term) desc) = 1 as is_latest,
  lw.path || '/' || case a.type when 'graded' then 'graded-assignment' else 'practice-assignment' end
    || case
         when rank() over (partition by a.week_id, a.type order by private.term_sort_key(a.term) desc) = 1 then ''
         else '/' || a.term
       end as path
from public.assignments a
join private.live_weeks lw on lw.id = a.week_id
where a.type in ('graded', 'practice')
  and private.is_live(a.is_published, a.published_at, a.deleted_at);

-- Live notes with the canonical path for their kind.
create or replace view private.live_notes
with (security_invoker = true)
as
select
  n.*,
  lc.program_slug,
  lc.slug as course_slug,
  lw.week_number,
  case n.kind
    when 'week' then lw.path || '/notes'
    when 'formula_sheet' then lc.path || '/formula-sheet'
    when 'exam_prep' then lc.path || '/qualifier-exam-prep'
    else lc.path || '/notes/' || n.slug
  end as path
from public.notes n
join private.live_courses lc on lc.id = n.course_id
left join private.live_weeks lw on lw.id = n.week_id
where private.is_live(n.is_published, n.published_at, n.deleted_at)
  and (n.kind <> 'week' or lw.id is not null);

grant select on private.live_courses, private.live_weeks, private.live_assignments, private.live_notes
  to anon, authenticated, service_role;

-- ── Route manifest for the proxy ─────────────────────────────────────────────
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

grant execute on function public.get_route_manifest() to anon, authenticated, service_role;

-- ── Sitemap entries ──────────────────────────────────────────────────────────
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
  select 'courses', lc.path, lc.updated_at
  from private.live_courses lc where not lc.noindex
  union all
  select 'weeks', lw.path, lw.updated_at
  from private.live_weeks lw where not lw.noindex and lw.has_content
  union all
  -- assignments.updated_at is bumped whenever one of its questions changes.
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

grant execute on function public.get_sitemap_entries() to anon, authenticated, service_role;

-- Week hubs: whether the page has enough live content to be indexed.
create or replace function public.get_week_content_flags(p_week_ids uuid[])
returns table (week_id uuid, has_content boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select lw.id, lw.has_content from private.live_weeks lw where lw.id = any (p_week_ids)
$$;

grant execute on function public.get_week_content_flags(uuid[]) to anon, authenticated, service_role;
