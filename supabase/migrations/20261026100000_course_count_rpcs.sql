-- ─────────────────────────────────────────────────────────────────────────────
-- Per-course note and lecture counts, computed in the database.
--
-- The notes and lectures listings used to download the course of every live
-- note (~650 rows) and every live lecture (~6000 rows, seven requests) just to
-- count them. These return one small row per course instead.
-- ─────────────────────────────────────────────────────────────────────────────

-- Live notes per note course.
create or replace function public.get_note_counts()
returns table (note_course_id uuid, note_count integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select r.note_course_id, count(*)::integer
  from public.resources r
  where r.note_course_id is not null
    and private.is_live(r.is_published, r.published_at, r.deleted_at)
  group by r.note_course_id
$$;

revoke execute on function public.get_note_counts() from public;
grant execute on function public.get_note_counts() to anon, authenticated, service_role;

-- Live lectures per note course: the total, how many each week (1 and up)
-- has, in week order, and the latest lecture edit.
create or replace function public.get_lecture_stats()
returns table (note_course_id uuid, video_count integer, weeks jsonb, updated_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  with live as (
    select lv.note_course_id, lv.week, lv.updated_at
    from public.lecture_videos lv
    where private.is_live(lv.is_published, lv.published_at, lv.deleted_at)
  ),
  per_week as (
    select l.note_course_id, l.week, count(*)::integer as n
    from live l
    where l.week >= 1
    group by l.note_course_id, l.week
  )
  select
    l.note_course_id,
    count(*)::integer,
    coalesce(
      (select jsonb_agg(jsonb_build_object('week', pw.week, 'count', pw.n) order by pw.week)
       from per_week pw where pw.note_course_id = l.note_course_id),
      '[]'::jsonb
    ),
    max(l.updated_at)
  from live l
  group by l.note_course_id
$$;

revoke execute on function public.get_lecture_stats() from public;
grant execute on function public.get_lecture_stats() to anon, authenticated, service_role;
