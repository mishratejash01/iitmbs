-- ─────────────────────────────────────────────────────────────────────────────
-- Content items: assignments + questions, notes, resources, FAQs and CMS pages.
--
-- Integrity rules enforced here:
-- * Every item records where its material came from (source_permission) — we
--   publish original work, material shared with permission, or links to
--   official sources; never scraped copies.
-- * Graded-assignment answers are only ever read through the
--   get_assignment_questions() RPC, which withholds answer_mdx,
--   explanation_mdx and answer_key until solutions_release_at.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Assignments ──────────────────────────────────────────────────────────────
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  -- null = course-level set (e.g. qualifier exam practice) rather than a week's.
  week_id uuid references public.weeks (id) on delete cascade,
  type public.assignment_type not null,
  term public.term_code not null,
  title text not null check (length(title) between 2 and 200),
  summary text check (length(summary) <= 1000),
  intro_mdx text,
  concepts text[] not null default '{}',
  common_mistakes_mdx text,
  due_at timestamptz,
  solutions_release_at timestamptz not null,
  estimated_minutes smallint check (estimated_minutes between 1 and 600),
  author_id uuid references public.authors (id) on delete set null,
  reviewer_id uuid references public.authors (id) on delete set null,
  source_permission public.source_permission not null default 'original',
  source_url text,
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
  updated_by uuid,
  -- A graded assignment's walkthrough must not unlock before it is due.
  constraint assignments_release_after_due check (
    type <> 'graded' or due_at is null or solutions_release_at >= due_at
  )
);

create unique index assignments_week_type_term_key
  on public.assignments (week_id, type, term)
  where deleted_at is null and week_id is not null;
create index assignments_course_id_idx on public.assignments (course_id);
create index assignments_week_id_idx on public.assignments (week_id);
create index assignments_due_at_idx on public.assignments (due_at) where deleted_at is null;
create index assignments_release_idx on public.assignments (solutions_release_at) where deleted_at is null;

-- ── Questions ────────────────────────────────────────────────────────────────
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  position smallint not null check (position between 1 and 500),
  question_type public.question_type not null,
  question_mdx text not null,
  -- [{ "id": "a", "label_mdx": "..." }, ...] for mcq / msq
  options jsonb not null default '[]' check (jsonb_typeof(options) = 'array'),
  hint_mdx text,
  -- ── Gated until the assignment's solutions_release_at ──
  answer_mdx text,
  explanation_mdx text,
  -- Machine-checkable key: {"correct":["b"]} | {"value":3.5,"tolerance":0.01} | {"accepted":["..."]}
  answer_key jsonb check (answer_key is null or jsonb_typeof(answer_key) = 'object'),
  -- ──
  concept_tags text[] not null default '{}',
  difficulty public.difficulty,
  marks numeric(5, 2) check (marks >= 0),
  source_permission public.source_permission not null default 'original',
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid,
  constraint questions_options_for_choice check (
    question_type not in ('mcq', 'msq') or jsonb_array_length(options) >= 2
  )
);

create unique index questions_assignment_position_key
  on public.questions (assignment_id, position) where deleted_at is null;
create index questions_concept_tags_idx on public.questions using gin (concept_tags);

comment on column public.questions.answer_mdx is
  'Gated: never selectable by anon/authenticated. Read via get_assignment_questions() only.';

-- ── Notes ────────────────────────────────────────────────────────────────────
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  week_id uuid references public.weeks (id) on delete set null,
  kind public.note_kind not null default 'topic',
  slug public.slug not null,
  title text not null check (length(title) between 2 and 200),
  summary text check (length(summary) <= 1000),
  body_mdx text not null default '',
  word_count integer not null default 0,
  reading_time_minutes smallint not null default 1,
  version integer not null default 1,
  author_id uuid references public.authors (id) on delete set null,
  reviewer_id uuid references public.authors (id) on delete set null,
  reviewed_at timestamptz,
  source_permission public.source_permission not null default 'original',
  source_url text,
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
  updated_by uuid,
  constraint notes_week_kind_needs_week check (kind <> 'week' or week_id is not null)
);

create unique index notes_course_slug_key on public.notes (course_id, slug) where deleted_at is null;
create index notes_week_id_idx on public.notes (week_id);
create index notes_course_kind_idx on public.notes (course_id, kind);

-- Each of these kinds has exactly one canonical page, so at most one live row:
--   week          → /<programme>/<course>/week-<n>/notes
--   formula_sheet → /<programme>/<course>/formula-sheet
--   exam_prep     → /<programme>/<course>/qualifier-exam-prep
-- Topic notes (any number) live at /<programme>/<course>/notes/<slug>.
create unique index notes_one_week_note_key on public.notes (week_id)
  where kind = 'week' and deleted_at is null;
create unique index notes_one_formula_sheet_key on public.notes (course_id)
  where kind = 'formula_sheet' and deleted_at is null;
create unique index notes_one_exam_prep_key on public.notes (course_id)
  where kind = 'exam_prep' and deleted_at is null;

-- Keeps word count, reading time (200 wpm) and version in sync with the body.
create or replace function private.notes_derive()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.word_count := private.word_count(new.body_mdx);
  new.reading_time_minutes := greatest(1, ceil(new.word_count / 200.0))::smallint;
  if tg_op = 'UPDATE' and new.body_mdx is distinct from old.body_mdx then
    new.version := old.version + 1;
  end if;
  return new;
end;
$$;

-- ── Resources (downloads and curated links) ──────────────────────────────────
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses (id) on delete cascade,
  week_id uuid references public.weeks (id) on delete cascade,
  kind public.resource_kind not null,
  title text not null check (length(title) between 2 and 200),
  description text check (length(description) <= 500),
  url text check (url ~ '^https://'),
  cloudinary_public_id text,
  cloudinary_resource_type text check (cloudinary_resource_type in ('image', 'raw', 'video')),
  file_format text check (length(file_format) <= 16),
  file_bytes bigint check (file_bytes >= 0),
  source_url text,
  source_permission public.source_permission not null,
  requires_login boolean not null default false,
  download_count bigint not null default 0,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid,
  constraint resources_has_target check (url is not null or cloudinary_public_id is not null),
  constraint resources_link_is_url check (kind <> 'link' or url is not null)
);

create index resources_course_id_idx on public.resources (course_id);
create index resources_week_id_idx on public.resources (week_id);

-- ── FAQs ─────────────────────────────────────────────────────────────────────
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  scope public.faq_scope not null default 'global',
  -- programs/courses/weeks/assignments/pages id matching the scope; null for global.
  scope_id uuid,
  question text not null check (length(question) between 5 and 300),
  answer_mdx text not null,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid,
  constraint faqs_scope_id_matches check ((scope = 'global') = (scope_id is null))
);

create index faqs_scope_idx on public.faqs (scope, scope_id, sort_order);

-- ── CMS pages (about, qualifier guides, privacy, terms, …) ──────────────────
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  path public.page_path not null,
  title text not null check (length(title) between 2 and 200),
  summary text check (length(summary) <= 1000),
  body_mdx text not null default '',
  -- [{ "title": "...", "url": "https://..." }] — official sources we summarise.
  sources jsonb not null default '[]' check (jsonb_typeof(sources) = 'array'),
  template text not null default 'default' check (template in ('default', 'legal', 'guide')),
  author_id uuid references public.authors (id) on delete set null,
  reviewer_id uuid references public.authors (id) on delete set null,
  last_reviewed_at timestamptz,
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

create unique index pages_path_key on public.pages (path) where deleted_at is null;

-- ── Triggers ─────────────────────────────────────────────────────────────────
create trigger assignments_touch before insert or update on public.assignments
  for each row execute function private.touch_row();
create trigger assignments_publish before insert or update on public.assignments
  for each row execute function private.default_published_at();

create trigger questions_touch before insert or update on public.questions
  for each row execute function private.touch_row();

-- Editing a question counts as editing its assignment ("last updated" dates,
-- sitemap lastmod and cache revalidation all key off assignments.updated_at).
create or replace function private.bump_parent_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    update public.assignments set updated_at = now() where id = new.assignment_id;
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.assignment_id <> new.assignment_id) then
    update public.assignments set updated_at = now() where id = old.assignment_id;
  end if;
  return null;
end;
$$;

create trigger questions_bump_assignment after insert or update or delete on public.questions
  for each row execute function private.bump_parent_assignment();

create trigger notes_touch before insert or update on public.notes
  for each row execute function private.touch_row();
create trigger notes_publish before insert or update on public.notes
  for each row execute function private.default_published_at();
create trigger notes_derive before insert or update on public.notes
  for each row execute function private.notes_derive();

create trigger resources_touch before insert or update on public.resources
  for each row execute function private.touch_row();
create trigger resources_publish before insert or update on public.resources
  for each row execute function private.default_published_at();

create trigger faqs_touch before insert or update on public.faqs
  for each row execute function private.touch_row();
create trigger faqs_publish before insert or update on public.faqs
  for each row execute function private.default_published_at();

create trigger pages_touch before insert or update on public.pages
  for each row execute function private.touch_row();
create trigger pages_publish before insert or update on public.pages
  for each row execute function private.default_published_at();
