-- ─────────────────────────────────────────────────────────────────────────────
-- Previous year question papers (PYQs), grouped by course.
--
--   /pyq                     index (title and SEO from the CMS page "pyq")
--   /pyq/<slug>              one course's papers, by exam and term
--   /pyq/<slug>/<exam>       one exam's papers (quiz-1, quiz-2, end-term, oppe-1, oppe-2)
--
-- Courses are the note_courses rows, so a course's notes and papers share one
-- record. A row is one course's paper for one exam sitting. IITM session papers
-- hold every course sitting that session, so page_from/page_to say where this
-- course's questions are inside the linked file.
-- ─────────────────────────────────────────────────────────────────────────────

-- "/pyq" is a fixed route, so no programme may use that slug.
alter table public.programs drop constraint programs_slug_not_reserved;
alter table public.programs add constraint programs_slug_not_reserved check (slug not in (
  'about', 'admin', 'api', 'auth', 'blog', 'contact', 'dashboard', 'login', 'logout', 'notes', 'offline',
  'onboarding', 'privacy', 'pyq', 'qualifier', 'resources', 'search', 'sitemaps', 'terms'
));

create table public.question_papers (
  id uuid primary key default gen_random_uuid(),
  note_course_id uuid not null references public.note_courses (id) on delete cascade,
  -- Term of the exam, e.g. 2025-sep for the September 2025 term.
  term text not null check (term ~ '^[0-9]{4}-(jan|may|sep)$'),
  exam text not null check (exam in ('quiz-1', 'quiz-2', 'end-term', 'oppe-1', 'oppe-2')),
  -- End-term exams run a forenoon and an afternoon paper.
  session text check (session in ('fn', 'an')),
  exam_date date,
  -- Distinct papers for the same sitting (different question sets): 1, 2, 3 ...
  variant smallint not null default 1 check (variant between 1 and 20),
  url text not null check (url ~ '^https://'),
  file_name text check (length(file_name) <= 200),
  -- Where this course's questions are inside a combined session paper.
  page_from integer check (page_from > 0),
  page_to integer check (page_to >= page_from),
  question_count smallint check (question_count > 0),
  -- The paper marks the correct options.
  has_answers boolean not null default false,
  contributor text check (length(contributor) between 1 and 120),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid
);

create unique index question_papers_sitting_key on public.question_papers
  (note_course_id, term, exam, coalesce(session, ''), variant) where deleted_at is null;
create index question_papers_note_course_id_idx on public.question_papers (note_course_id, exam, term);

create trigger question_papers_touch before insert or update on public.question_papers
  for each row execute function private.touch_row();
create trigger question_papers_publish before insert or update on public.question_papers
  for each row execute function private.default_published_at();

alter table public.question_papers enable row level security;
grant select on public.question_papers to anon, authenticated;
grant insert, update, delete on public.question_papers to authenticated;
grant all on public.question_papers to service_role;

create policy "question_papers: anon reads live rows" on public.question_papers for select to anon
  using (private.is_live(is_published, published_at, deleted_at));
create policy "question_papers: read live rows, staff read all" on public.question_papers for select to authenticated
  using (private.is_live(is_published, published_at, deleted_at) or (select private.is_staff()));
create policy "question_papers: staff insert" on public.question_papers for insert to authenticated
  with check ((select private.is_staff()));
create policy "question_papers: staff update" on public.question_papers for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "question_papers: admins delete" on public.question_papers for delete to authenticated
  using ((select private.is_admin()));

create trigger question_papers_audit after insert or update or delete on public.question_papers
  for each row execute function private.audit_row();
create trigger question_papers_revalidate after insert or update or delete on public.question_papers
  for each statement execute function private.notify_content_change();
create trigger question_papers_search_dirty after insert or update or delete on public.question_papers
  for each statement execute function private.mark_search_dirty();

-- ── Routing view: live courses with at least one live paper ─────────────────
create or replace view private.live_pyq_courses
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
  '/pyq/' || nc.slug as path,
  count(qp.id) as paper_count,
  array_agg(distinct qp.exam order by qp.exam) as exams,
  greatest(nc.updated_at, max(qp.updated_at)) as content_updated_at
from public.note_courses nc
join public.question_papers qp
  on qp.note_course_id = nc.id
 and private.is_live(qp.is_published, qp.published_at, qp.deleted_at)
where private.is_live(nc.is_published, nc.published_at, nc.deleted_at)
group by nc.id;

grant select on private.live_pyq_courses to anon, authenticated, service_role;

-- ── Scheduled go-live and search refresh cover papers too ───────────────────
create or replace function private.revalidate_scheduled_content()
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_since timestamptz;
  v_now timestamptz := now();
  v_tables text[] := '{}';
begin
  select last_scheduled_check into v_since from private.revalidation_state where id for update;

  if exists (select 1 from public.programs where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'programs';
  end if;
  if exists (select 1 from public.courses where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'courses';
  end if;
  if exists (select 1 from public.weeks where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'weeks';
  end if;
  if exists (
    select 1 from public.assignments
    where is_published and deleted_at is null
      and ((published_at > v_since and published_at <= v_now)
        or (solutions_release_at > v_since and solutions_release_at <= v_now))
  ) then
    v_tables := v_tables || array['assignments', 'questions'];
  end if;
  if exists (select 1 from public.notes where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'notes';
  end if;
  if exists (select 1 from public.resources where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'resources';
  end if;
  if exists (select 1 from public.faqs where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'faqs';
  end if;
  if exists (select 1 from public.pages where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'pages';
  end if;
  if exists (select 1 from public.blog_categories where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'blog_categories';
  end if;
  if exists (select 1 from public.blog_posts where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'blog_posts';
  end if;
  if exists (select 1 from public.note_courses where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'note_courses';
  end if;
  if exists (select 1 from public.question_papers where published_at > v_since and published_at <= v_now and is_published) then
    v_tables := v_tables || 'question_papers';
  end if;

  update private.revalidation_state set last_scheduled_check = v_now where id;

  if cardinality(v_tables) > 0 then
    perform private.post_revalidation(v_tables, 'schedule');
  end if;
  return v_tables;
end;
$$;

create or replace function private.refresh_search_index(p_force boolean default false)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_state private.search_state;
  v_due boolean;
begin
  select * into v_state from private.search_state where id;
  v_due := p_force or v_state.dirty or exists (
    select 1 from (
      select published_at from public.programs union all
      select published_at from public.courses union all
      select published_at from public.weeks union all
      select published_at from public.assignments union all
      select published_at from public.notes union all
      select published_at from public.faqs union all
      select published_at from public.pages union all
      select published_at from public.blog_categories union all
      select published_at from public.blog_posts union all
      select published_at from public.note_courses union all
      select published_at from public.question_papers
    ) s
    where s.published_at > v_state.refreshed_at and s.published_at <= now()
  );
  if not v_due then
    return false;
  end if;
  update private.search_state set dirty = false, refreshed_at = now() where id;
  refresh materialized view concurrently private.search_index;
  return true;
end;
$$;

-- ── Sitemap: each course's PYQ page and one page per exam ───────────────────
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
$$;

-- ── Link index: PYQ course pages ────────────────────────────────────────────
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
$$;

-- ── Site search: add PYQ course pages ───────────────────────────────────────
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
blog_post_rows as (
  select
    'blog_post', lbp.id, lbp.path,
    lbp.title, 'Blog · ' || lbp.category_name,
    (select p.slug::text from programs p where p.id = lbp.program_id), null::uuid, null::smallint, 'blog_post',
    left(private.mdx_to_text(coalesce(lbp.summary, '') || ' ' || lbp.body_mdx), 4000),
    lbp.title || ' ' || array_to_string(lbp.tags, ' ') || ' ' || array_to_string(lbp.keywords, ' '),
    lbp.updated_at
  from private.live_blog_posts lbp
  where not lbp.noindex
),
blog_category_rows as (
  select
    'blog_category', lbc.id, lbc.path,
    lbc.name, 'Blog category',
    null::text, null::uuid, null::smallint, 'blog_category',
    left(private.mdx_to_text(coalesce(lbc.description, '') || ' ' || lbc.intro_mdx), 4000),
    lbc.name || ' ' || array_to_string(lbc.keywords, ' '),
    lbc.content_updated_at
  from private.live_blog_categories lbc
  where not lbc.noindex and lbc.post_count > 0
),
note_course_rows as (
  select
    'note_course', lnc.id, lnc.path,
    lnc.name || ' notes', 'Student notes · ' || lnc.code,
    (select p.slug::text from programs p where p.id = lnc.program_id), null::uuid, null::smallint, 'note_course',
    lnc.name || ' ' || lnc.short_name || ' ' || lnc.code
      || ' notes pdf handwritten notes student notes ' || array_to_string(lnc.keywords, ' '),
    lnc.name || ' ' || lnc.short_name || ' ' || lnc.code || ' notes handwritten '
      || array_to_string(lnc.keywords, ' '),
    lnc.content_updated_at
  from private.live_note_courses lnc
  where not lnc.noindex and lnc.note_count > 0
),
pyq_course_rows as (
  select
    'pyq_course', lpc.id, lpc.path,
    lpc.name || ' PYQs', 'Previous year question papers · ' || lpc.code,
    (select p.slug::text from programs p where p.id = lpc.program_id), null::uuid, null::smallint, 'pyq_course',
    lpc.name || ' ' || lpc.short_name || ' ' || lpc.code
      || ' pyq pyqs previous year question papers question paper with answers quiz 1 quiz 2 end term '
      || array_to_string(lpc.exams, ' '),
    lpc.name || ' ' || lpc.short_name || ' ' || lpc.code || ' pyq previous year question paper',
    lpc.content_updated_at
  from private.live_pyq_courses lpc
  where not lpc.noindex
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
  union all select * from blog_post_rows
  union all select * from blog_category_rows
  union all select * from note_course_rows
  union all select * from pyq_course_rows
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

update private.search_state set dirty = false, refreshed_at = now() where id;
