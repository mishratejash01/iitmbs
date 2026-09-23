-- ─────────────────────────────────────────────────────────────────────────────
-- Blog: plain-English articles about the programme (admissions, fees, exams,
-- rules, levels, careers). Posts belong to one category.
--
--   /blog                        index (its title and intro are the CMS page "blog")
--   /blog/<slug>                 a post
--   /blog/category/<slug>        a category
--
-- Posts follow the same publishing model as every other content table: RLS
-- for live rows, audit log, revisions, cache revalidation webhook, scheduled
-- go-live, site search, sitemap and link index.
-- ─────────────────────────────────────────────────────────────────────────────

-- "/blog" is a fixed route, so no programme may use that slug.
alter table public.programs drop constraint programs_slug_not_reserved;
alter table public.programs add constraint programs_slug_not_reserved check (slug not in (
  'about', 'admin', 'api', 'auth', 'blog', 'contact', 'dashboard', 'login', 'logout', 'offline',
  'onboarding', 'privacy', 'qualifier', 'resources', 'search', 'sitemaps', 'terms'
));

-- ── Tables ───────────────────────────────────────────────────────────────────
create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug public.slug not null,
  name text not null check (length(name) between 2 and 80),
  description text check (length(description) <= 500),
  intro_mdx text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  seo_title text check (length(seo_title) <= 120),
  seo_description text check (length(seo_description) <= 320),
  og_image_public_id text,
  canonical_path text,
  noindex boolean not null default false,
  keywords text[] not null default '{}',
  schema_overrides jsonb not null default '{}' check (jsonb_typeof(schema_overrides) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid
);

create unique index blog_categories_slug_key on public.blog_categories (slug) where deleted_at is null;

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  -- "category" and "rss" are path segments of fixed blog routes.
  slug public.slug not null check (slug not in ('category', 'rss', 'page', 'tag')),
  title text not null check (length(title) between 5 and 200),
  summary text check (length(summary) <= 500),
  body_mdx text not null default '',
  category_id uuid not null references public.blog_categories (id) on delete restrict,
  -- The programme the post is about; null when it applies to both.
  program_id uuid references public.programs (id) on delete set null,
  tags text[] not null default '{}',
  -- [{ "title": "...", "url": "https://..." }] — official sources we summarise.
  sources jsonb not null default '[]' check (jsonb_typeof(sources) = 'array'),
  source_permission public.source_permission not null default 'original',
  source_url text check (source_url ~ '^https://'),
  author_id uuid references public.authors (id) on delete set null,
  reviewer_id uuid references public.authors (id) on delete set null,
  last_reviewed_at timestamptz,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  word_count integer not null default 0,
  reading_time_minutes smallint not null default 1,
  is_published boolean not null default false,
  published_at timestamptz,
  seo_title text check (length(seo_title) <= 120),
  seo_description text check (length(seo_description) <= 320),
  og_image_public_id text,
  canonical_path text,
  noindex boolean not null default false,
  keywords text[] not null default '{}',
  schema_overrides jsonb not null default '{}' check (jsonb_typeof(schema_overrides) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid
);

create unique index blog_posts_slug_key on public.blog_posts (slug) where deleted_at is null;
create index blog_posts_live_idx on public.blog_posts (category_id, published_at desc)
  where is_published and deleted_at is null;
create index blog_posts_category_id_idx on public.blog_posts (category_id);
create index blog_posts_program_id_idx on public.blog_posts (program_id);
create index blog_posts_author_id_idx on public.blog_posts (author_id);
create index blog_posts_reviewer_id_idx on public.blog_posts (reviewer_id);
create index blog_categories_live_idx on public.blog_categories (sort_order)
  where is_published and deleted_at is null;

-- ── Row triggers ─────────────────────────────────────────────────────────────
create or replace function private.blog_posts_derive()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.word_count := private.word_count(new.body_mdx);
  new.reading_time_minutes := greatest(1, ceil(new.word_count / 200.0))::smallint;
  return new;
end;
$$;

create trigger blog_categories_touch before insert or update on public.blog_categories
  for each row execute function private.touch_row();
create trigger blog_categories_publish before insert or update on public.blog_categories
  for each row execute function private.default_published_at();

create trigger blog_posts_touch before insert or update on public.blog_posts
  for each row execute function private.touch_row();
create trigger blog_posts_publish before insert or update on public.blog_posts
  for each row execute function private.default_published_at();
create trigger blog_posts_derive before insert or update on public.blog_posts
  for each row execute function private.blog_posts_derive();

-- ── Access control (same model as the other publishable tables) ─────────────
do $$
declare
  t text;
begin
  foreach t in array array['blog_categories', 'blog_posts']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);

    execute format(
      'create policy %I on public.%I for select to anon
         using (private.is_live(is_published, published_at, deleted_at))',
      t || ': anon reads live rows', t);
    execute format(
      'create policy %I on public.%I for select to authenticated
         using (private.is_live(is_published, published_at, deleted_at) or (select private.is_staff()))',
      t || ': read live rows, staff read all', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check ((select private.is_staff()))',
      t || ': staff insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated
         using ((select private.is_staff())) with check ((select private.is_staff()))',
      t || ': staff update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated
         using ((select private.is_admin()))',
      t || ': admins delete', t);

    -- Audit log, cache revalidation and search refresh, as for other content.
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function private.audit_row()',
      t || '_audit', t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each statement execute function private.notify_content_change()',
      t || '_revalidate', t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each statement execute function private.mark_search_dirty()',
      t || '_search_dirty', t);
  end loop;
end;
$$;

-- Revision history for posts.
alter table public.content_revisions drop constraint content_revisions_table_name_check;
alter table public.content_revisions add constraint content_revisions_table_name_check
  check (table_name in ('notes', 'questions', 'assignments', 'pages', 'blog_posts'));

create trigger blog_posts_revision before update on public.blog_posts
  for each row execute function private.snapshot_revision();

-- ── Routing view ─────────────────────────────────────────────────────────────
-- A post is live only while its category is live too.
create or replace view private.live_blog_posts
with (security_invoker = true)
as
select
  bp.*,
  bc.slug as category_slug,
  bc.name as category_name,
  '/blog/' || bp.slug as path
from public.blog_posts bp
join public.blog_categories bc on bc.id = bp.category_id
where private.is_live(bp.is_published, bp.published_at, bp.deleted_at)
  and private.is_live(bc.is_published, bc.published_at, bc.deleted_at);

create or replace view private.live_blog_categories
with (security_invoker = true)
as
select
  bc.*,
  '/blog/category/' || bc.slug as path,
  (select count(*) from private.live_blog_posts lbp where lbp.category_id = bc.id) as post_count,
  greatest(bc.updated_at, (select max(lbp.updated_at) from private.live_blog_posts lbp
                           where lbp.category_id = bc.id)) as content_updated_at
from public.blog_categories bc
where private.is_live(bc.is_published, bc.published_at, bc.deleted_at);

grant select on private.live_blog_posts, private.live_blog_categories to anon, authenticated, service_role;

-- ── Scheduled go-live ────────────────────────────────────────────────────────
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
      select published_at from public.blog_posts
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

-- ── Sitemap: posts and categories with at least one live post ───────────────
-- (The /blog index itself is the CMS page "blog", listed under pages.)
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
$$;

-- ── Link index: posts and categories (RelatedLink, OG cards, quality gate) ──
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
$$;

-- ── Site search: add posts and categories ────────────────────────────────────
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
