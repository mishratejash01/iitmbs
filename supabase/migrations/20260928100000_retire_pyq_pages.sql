-- ─────────────────────────────────────────────────────────────────────────────
-- Previous year papers are no longer on this site.
--
-- Every /pyq address now answers with a permanent redirect (next.config.ts),
-- so the papers leave the sitemap and the link index, and are unpublished:
-- visitors and the public API no longer read them, and the search index drops
-- them on its next refresh. The rows stay in the table.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_sitemap_entries()
 RETURNS TABLE(section text, path text, last_modified timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  union all
  select 'blog', lbc.path, lbc.content_updated_at
  from private.live_blog_categories lbc where not lbc.noindex and lbc.post_count > 0
  union all
  select 'blog', lbp.path, lbp.updated_at
  from private.live_blog_posts lbp where not lbp.noindex
  union all
  select 'notes', lnc.path, lnc.content_updated_at
  from private.live_note_courses lnc where not lnc.noindex and lnc.note_count > 0
  union all
  select 'lectures', llc.path, llc.content_updated_at
  from private.live_lecture_courses llc where not llc.noindex
  union all
  select 'lectures', llc.path || '/week-' || w.week, llc.content_updated_at
  from private.live_lecture_courses llc cross join unnest(llc.weeks) as w (week)
  where not llc.noindex
$function$;

CREATE OR REPLACE FUNCTION public.get_link_index()
 RETURNS TABLE(path text, title text, summary text, kind text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  union all
  select lbc.path, lbc.name, lbc.description, 'blog_category'
  from private.live_blog_categories lbc
  union all
  select lbp.path, lbp.title, lbp.summary, 'blog_post'
  from private.live_blog_posts lbp
  union all
  select lnc.path, lnc.name || ' notes', null::text, 'note_course'
  from private.live_note_courses lnc
  union all
  select llc.path, llc.name || ' lectures by IIT Madras', null::text, 'lecture_course'
  from private.live_lecture_courses llc
  union all
  select llc.path || '/week-' || w.week, llc.name || ' week ' || w.week || ' lectures', null::text, 'lecture_course'
  from private.live_lecture_courses llc cross join unnest(llc.weeks) as w (week)
$function$;

update public.question_papers set is_published = false where is_published;

update public.pages set is_published = false where path = 'pyq' and is_published;
