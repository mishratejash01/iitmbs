-- ─────────────────────────────────────────────────────────────────────────────
-- Question papers: qualifier exams, a short note ("re-attempt") and one row
-- per sitting date.
--
-- The qualifier and its re-attempt fall in the same term, so the date is part
-- of what makes a paper unique; variant numbers only separate question sets
-- sat on the same date and session. Exam pages get their own link index rows
-- so they have a specific social card.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.question_papers drop constraint question_papers_exam_check;
alter table public.question_papers add constraint question_papers_exam_check
  check (exam in ('qualifier', 'quiz-1', 'quiz-2', 'end-term', 'oppe-1', 'oppe-2'));

alter table public.question_papers
  add column note text check (length(note) between 1 and 60);

drop index public.question_papers_sitting_key;
create unique index question_papers_sitting_key on public.question_papers
  (note_course_id, term, exam, coalesce(session, ''), coalesce(exam_date, '1900-01-01'::date), variant)
  where deleted_at is null;

-- ── Link index: PYQ course and exam pages ───────────────────────────────────
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
$$;
