-- ─────────────────────────────────────────────────────────────────────────────
-- Link index: every live URL with its title and summary.
--
-- Used to resolve <RelatedLink href="..."/> in MDX (so editors only type a
-- path and the title/summary stay in sync with the target page), to validate
-- internal links in the admin quality gate, and by the 404 page's suggestions.
-- ─────────────────────────────────────────────────────────────────────────────

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

revoke execute on function public.get_link_index() from public;
grant execute on function public.get_link_index() to anon, authenticated, service_role;
