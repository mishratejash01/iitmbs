-- ─────────────────────────────────────────────────────────────────────────────
-- Lecture numbers as the channel writes them: "5", "5A", "1.1" (a part of
-- lecture 1) and "T2" (tutorial 2).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.lecture_videos drop constraint lecture_videos_lecture_check;
alter table public.lecture_videos add constraint lecture_videos_lecture_check
  check (lecture ~ '^T?[0-9]{1,3}(\.[0-9]{1,2})?[A-Z]?$');
