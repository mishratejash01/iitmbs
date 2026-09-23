-- ─────────────────────────────────────────────────────────────────────────────
-- Site search covers every live week hub, not only weeks with published notes
-- or assignments. A week hub always lists the official topics, so it is the
-- right answer to "maths 1 week 2" even before walkthroughs are written.
-- (Google still sees empty week hubs as noindex; that rule is unchanged.)
--
-- Materialized views cannot be altered in place, so the index is rebuilt with
-- the same definition minus the has_content filter.
-- ─────────────────────────────────────────────────────────────────────────────

drop materialized view private.search_index;

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

-- Rebuilt with data above; record it so the next cron tick does not redo it.
update private.search_state set dirty = false, refreshed_at = now() where id;
