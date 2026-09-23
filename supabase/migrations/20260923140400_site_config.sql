-- ─────────────────────────────────────────────────────────────────────────────
-- Site configuration: settings, navigation, footer, redirects, SEO overrides
-- and admin-only keyword research notes. Nothing site-specific is hard-coded
-- in the application; it all lives here.
-- ─────────────────────────────────────────────────────────────────────────────

-- Single-row settings document. The application validates its shape with Zod
-- and falls back to safe defaults for missing keys.
create table public.site_settings (
  id boolean primary key default true check (id),
  data jsonb not null default '{}' check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

comment on table public.site_settings is
  'One row. data holds site_name, base_url, tagline, theme tokens, social links, verification codes, revalidate seconds, feature flags, announcement bar, SEO templates, analytics retention.';

create or replace function private.touch_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

create trigger site_settings_touch before insert or update on public.site_settings
  for each row execute function private.touch_settings();

-- ── Navigation ───────────────────────────────────────────────────────────────
create table public.nav_items (
  id uuid primary key default gen_random_uuid(),
  -- header: primary nav · mobile: extra drawer links · quick: home quick links
  location text not null default 'header' check (location in ('header', 'mobile', 'quick')),
  label text not null check (length(label) between 1 and 60),
  href text not null check (href ~ '^(/|https://)'),
  description text check (length(description) <= 160),
  parent_id uuid references public.nav_items (id) on delete cascade,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  open_in_new_tab boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create index nav_items_location_idx on public.nav_items (location, sort_order);
create index nav_items_parent_id_idx on public.nav_items (parent_id);

create table public.footer_links (
  id uuid primary key default gen_random_uuid(),
  group_label text not null check (length(group_label) between 1 and 60),
  group_order integer not null default 0,
  label text not null check (length(label) between 1 and 60),
  href text not null check (href ~ '^(/|https://|mailto:)'),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  open_in_new_tab boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create index footer_links_group_idx on public.footer_links (group_order, sort_order);

-- ── Redirects (consumed by the edge proxy) ──────────────────────────────────
create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path public.url_path not null,
  to_path text not null check (to_path ~ '^(/|https://)'),
  status_code smallint not null default 301 check (status_code in (301, 302, 307, 308)),
  is_active boolean not null default true,
  notes text check (length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint redirects_from_lowercase check (from_path = lower(from_path)),
  constraint redirects_not_self check (from_path <> to_path)
);

create unique index redirects_from_path_key on public.redirects (from_path);

-- ── Per-path SEO overrides ──────────────────────────────────────────────────
create table public.seo_overrides (
  id uuid primary key default gen_random_uuid(),
  path public.url_path not null,
  title text check (length(title) <= 120),
  description text check (length(description) <= 320),
  canonical text,
  noindex boolean,
  og_image_public_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create unique index seo_overrides_path_key on public.seo_overrides (path);

-- ── Keyword research notes (admin/editor only, never public) ────────────────
create table public.keyword_clusters (
  id uuid primary key default gen_random_uuid(),
  path public.url_path not null,
  primary_keyword text not null check (length(primary_keyword) <= 200),
  secondary_keywords text[] not null default '{}',
  intent text check (intent in ('informational', 'navigational', 'answer_seeking', 'transactional')),
  notes text check (length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create unique index keyword_clusters_path_key on public.keyword_clusters (path);

create trigger nav_items_touch before insert or update on public.nav_items
  for each row execute function private.touch_row();
create trigger footer_links_touch before insert or update on public.footer_links
  for each row execute function private.touch_row();
create trigger redirects_touch before insert or update on public.redirects
  for each row execute function private.touch_row();
create trigger seo_overrides_touch before insert or update on public.seo_overrides
  for each row execute function private.touch_row();
create trigger keyword_clusters_touch before insert or update on public.keyword_clusters
  for each row execute function private.touch_row();
