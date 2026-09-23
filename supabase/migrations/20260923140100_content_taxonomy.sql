-- ─────────────────────────────────────────────────────────────────────────────
-- Content taxonomy: programmes → courses → weeks, plus the authors and media
-- library that content items reference. Access control lives in a later
-- migration once the role helpers exist.
--
-- Every publishable table carries the same SEO block:
--   seo_title, seo_description, og_image_public_id, canonical_path, noindex,
--   keywords, schema_overrides
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Authors (E-E-A-T bylines for notes, assignments and pages) ───────────────
create table public.authors (
  id uuid primary key default gen_random_uuid(),
  slug public.slug not null unique,
  name text not null check (length(name) between 2 and 120),
  headline text check (length(headline) <= 160),
  bio text check (length(bio) <= 2000),
  credentials text check (length(credentials) <= 300),
  avatar_public_id text,
  same_as text[] not null default '{}',
  profile_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

comment on table public.authors is 'People credited as author or reviewer on content (schema.org Person).';
comment on column public.authors.same_as is 'Public profile URLs used for schema.org sameAs.';

-- ── Media library (Cloudinary assets) ────────────────────────────────────────
create table public.media (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique check (length(public_id) between 1 and 255),
  resource_type text not null default 'image' check (resource_type in ('image', 'raw', 'video')),
  delivery_type text not null default 'upload' check (delivery_type in ('upload', 'authenticated')),
  format text check (length(format) <= 16),
  width integer check (width > 0),
  height integer check (height > 0),
  bytes bigint check (bytes >= 0),
  alt_text text check (length(alt_text) <= 300),
  caption text check (length(caption) <= 500),
  credit text check (length(credit) <= 300),
  source_permission public.source_permission not null default 'original',
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint media_image_needs_alt check (resource_type <> 'image' or alt_text is not null)
);

comment on table public.media is 'Cloudinary assets. Only identifiers and metadata are stored, never the files.';

-- ── Programmes ───────────────────────────────────────────────────────────────
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug public.slug not null unique,
  name text not null check (length(name) between 2 and 160),
  short_name text not null check (length(short_name) between 1 and 60),
  aliases text[] not null default '{}',
  description text check (length(description) <= 2000),
  intro_mdx text,
  official_url text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  -- SEO
  seo_title text check (length(seo_title) <= 120),
  seo_description text check (length(seo_description) <= 320),
  og_image_public_id text,
  canonical_path text,
  noindex boolean not null default false,
  keywords text[] not null default '{}',
  schema_overrides jsonb not null default '{}' check (jsonb_typeof(schema_overrides) = 'object'),
  -- bookkeeping
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid,
  -- Top-level URLs are shared with fixed routes; a programme may not shadow them.
  constraint programs_slug_not_reserved check (slug not in (
    'about', 'admin', 'api', 'auth', 'contact', 'dashboard', 'login', 'logout', 'offline',
    'onboarding', 'privacy', 'qualifier', 'resources', 'search', 'sitemaps', 'terms'
  ))
);

-- ── Courses ──────────────────────────────────────────────────────────────────
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  -- The canonical home programme; the course URL always lives under it.
  program_id uuid not null references public.programs (id) on delete restrict,
  slug public.slug not null,
  name text not null check (length(name) between 2 and 160),
  short_name text not null check (length(short_name) between 1 and 60),
  code text check (code ~ '^[A-Z0-9]{3,16}$'),
  aliases text[] not null default '{}',
  description text check (length(description) <= 2000),
  intro_mdx text,
  official_url text,
  credits numeric(4, 1) check (credits > 0),
  weeks_count smallint not null default 4 check (weeks_count between 1 and 16),
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

-- Slugs are unique within the canonical programme: DS "English I" (BSHS1001)
-- and ES "English I" (HS1101) are different courses and both live at
-- /<programme>/english-1.
create unique index courses_program_slug_key on public.courses (program_id, slug) where deleted_at is null;
create index courses_program_id_idx on public.courses (program_id);
create index courses_aliases_idx on public.courses using gin (aliases);

comment on column public.courses.aliases is
  'Spellings students search for (e.g. "maths 1", "math1"). Used for on-page mentions, search and 301s from alias slugs — never for separate pages.';

-- A course taught in several programmes is cross-listed here (e.g. the BS in
-- Management and Data Science reuses the four DS qualifier courses). It still
-- has exactly one canonical URL, under courses.program_id; the cross-listed
-- path 301-redirects there.
create table public.course_programs (
  program_id uuid not null references public.programs (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (program_id, course_id)
);

create index course_programs_course_id_idx on public.course_programs (course_id);

-- ── Weeks ────────────────────────────────────────────────────────────────────
create table public.weeks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  week_number smallint not null check (week_number between 1 and 16),
  title text not null check (length(title) between 2 and 160),
  summary text check (length(summary) <= 1000),
  topics text[] not null default '{}',
  intro_mdx text,
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

create unique index weeks_course_week_key on public.weeks (course_id, week_number) where deleted_at is null;

-- ── Triggers ─────────────────────────────────────────────────────────────────
create trigger authors_touch before insert or update on public.authors
  for each row execute function private.touch_row();
create trigger media_touch before insert or update on public.media
  for each row execute function private.touch_row();

create trigger programs_touch before insert or update on public.programs
  for each row execute function private.touch_row();
create trigger programs_publish before insert or update on public.programs
  for each row execute function private.default_published_at();

create trigger courses_touch before insert or update on public.courses
  for each row execute function private.touch_row();
create trigger courses_publish before insert or update on public.courses
  for each row execute function private.default_published_at();

create trigger weeks_touch before insert or update on public.weeks
  for each row execute function private.touch_row();
create trigger weeks_publish before insert or update on public.weeks
  for each row execute function private.default_published_at();
