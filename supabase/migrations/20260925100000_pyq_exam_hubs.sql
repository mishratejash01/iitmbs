-- ─────────────────────────────────────────────────────────────────────────────
-- PYQ exam hubs: /pyq/qualifier, /pyq/quiz-1, /pyq/quiz-2 and /pyq/end-term list
-- one exam's papers across every course. They join the sitemap and the link
-- index (for their social cards) once any course has a paper for that exam.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_sitemap_entries()
 RETURNS TABLE(section text, path text, last_modified timestamp with time zone)
 LANGUAGE sql
 STABLE
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
  select 'pyq', lpc.path, lpc.content_updated_at
  from private.live_pyq_courses lpc where not lpc.noindex
  union all
  select 'pyq', lpc.path || '/' || e.exam, lpc.content_updated_at
  from private.live_pyq_courses lpc cross join unnest(lpc.exams) as e (exam)
  where not lpc.noindex
  union all
  select 'pyq', '/pyq/' || e.exam, max(lpc.content_updated_at)
  from private.live_pyq_courses lpc cross join unnest(lpc.exams) as e (exam)
  where not lpc.noindex and e.exam in ('qualifier', 'quiz-1', 'quiz-2', 'end-term')
  group by e.exam
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
 STABLE
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
  select lpc.path, lpc.name || ' previous year question papers', null::text, 'pyq_course'
  from private.live_pyq_courses lpc
  union all
  select lpc.path || '/' || e.exam,
         lpc.name || ' ' || case e.exam
           when 'qualifier' then 'Qualifier'
           when 'quiz-1' then 'Quiz 1'
           when 'quiz-2' then 'Quiz 2'
           when 'end-term' then 'End Term'
           when 'oppe-1' then 'OPPE 1'
           else 'OPPE 2'
         end || ' previous year question papers',
         null::text, 'pyq_course'
  from private.live_pyq_courses lpc cross join unnest(lpc.exams) as e (exam)
  union all
  select distinct '/pyq/' || e.exam,
         case e.exam
           when 'qualifier' then 'IITM Qualifier PYQ for every subject'
           when 'quiz-1' then 'IITM BS Quiz 1 PYQ for every course'
           when 'quiz-2' then 'IITM BS Quiz 2 PYQ for every course'
           else 'IITM BS End Term PYQ for every course'
         end,
         null::text, 'pyq_course'
  from private.live_pyq_courses lpc cross join unnest(lpc.exams) as e (exam)
  where e.exam in ('qualifier', 'quiz-1', 'quiz-2', 'end-term')
  union all
  select llc.path, llc.name || ' lectures by IIT Madras', null::text, 'lecture_course'
  from private.live_lecture_courses llc
  union all
  select llc.path || '/week-' || w.week, llc.name || ' week ' || w.week || ' lectures', null::text, 'lecture_course'
  from private.live_lecture_courses llc cross join unnest(llc.weeks) as w (week)
$function$;
