-- ─────────────────────────────────────────────────────────────────────────────
-- Week pages only for courses taught week by week.
--
-- Some playlists name the week on only a handful of videos. Those courses get
-- one list of all their lectures instead of week pages, so `weeks` is empty
-- unless at least half of a course's lectures name their week. The site uses
-- the same rule (src/lib/data/lectures.ts).
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view private.live_lecture_courses
with (security_invoker = true)
as
select
  nc.id,
  nc.program_id,
  nc.code,
  nc.slug,
  nc.name,
  nc.short_name,
  nc.level,
  nc.noindex,
  '/resources/lectures/' || nc.slug as path,
  count(lv.id) as video_count,
  case
    when count(lv.id) filter (where lv.week between 1 and 16) * 2 >= count(lv.id)
      then coalesce(array_agg(distinct lv.week order by lv.week) filter (where lv.week between 1 and 16), '{}')
    else '{}'
  end as weeks,
  greatest(nc.updated_at, max(lv.updated_at)) as content_updated_at
from public.note_courses nc
join public.lecture_videos lv
  on lv.note_course_id = nc.id
 and private.is_live(lv.is_published, lv.published_at, lv.deleted_at)
where private.is_live(nc.is_published, nc.published_at, nc.deleted_at)
group by nc.id;

select private.refresh_search_index(true);
