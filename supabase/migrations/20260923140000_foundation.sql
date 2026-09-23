-- ─────────────────────────────────────────────────────────────────────────────
-- Foundation: extensions, the private helper schema, least-privilege defaults,
-- shared enums/domains and generic trigger functions.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Helper functions live in a schema the Data API never exposes.
create schema if not exists private;
revoke all on schema private from public;
-- API roles need USAGE so RLS policies can call the helpers below.
grant usage on schema private to anon, authenticated, service_role;

-- Least privilege: nothing created in these schemas is reachable by the API
-- roles unless a later migration grants it explicitly.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated;

-- ── Enums ────────────────────────────────────────────────────────────────────
create type public.user_role as enum ('student', 'editor', 'admin');
create type public.assignment_type as enum ('graded', 'practice', 'activity');
create type public.question_type as enum ('mcq', 'msq', 'numeric', 'text');
create type public.note_kind as enum ('week', 'topic', 'formula_sheet', 'exam_prep');
create type public.resource_kind as enum ('pdf', 'sheet', 'link', 'video');
create type public.source_permission as enum ('original', 'permission_granted', 'official_link');
create type public.faq_scope as enum ('global', 'program', 'course', 'week', 'assignment', 'page');
create type public.difficulty as enum ('easy', 'medium', 'hard');

-- ── Domains ──────────────────────────────────────────────────────────────────
-- URL slug: lowercase words joined by single hyphens.
create domain public.slug as text
  check (value ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and length(value) <= 80);

-- CMS page path: one or more slugs joined by "/", e.g. "qualifier/eligibility".
create domain public.page_path as text
  check (value ~ '^[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*)*$' and length(value) <= 160);

-- Academic term, e.g. "2026-sep". IITM BS runs January, May and September terms.
create domain public.term_code as text
  check (value ~ '^[0-9]{4}-(jan|may|sep)$');

-- Site-relative URL path used by redirects and SEO overrides, e.g. "/about".
create domain public.url_path as text
  check (value ~ '^/[^\s?#]*$' and length(value) <= 512);

-- ── Generic triggers ─────────────────────────────────────────────────────────

-- Maintains updated_at and the acting user on every write. Tables using it
-- must have updated_at, created_by and updated_by columns.
-- Counter bumps (e.g. download_count) run with app.counter_update = 'on' and
-- are not treated as content edits.
create or replace function private.touch_row()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and current_setting('app.counter_update', true) = 'on' then
    return new;
  end if;
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.created_by := coalesce(new.created_by, auth.uid());
  end if;
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

-- Lighter variant for tables that only track updated_at.
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Publishing: a row marked published without an explicit time goes live now.
-- A future published_at makes it "scheduled".
create or replace function private.default_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_published and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

-- ── Pure helpers ─────────────────────────────────────────────────────────────

-- True when a publishable row is live for the public. Inlined by the planner.
create or replace function private.is_live(
  p_is_published boolean,
  p_published_at timestamptz,
  p_deleted_at timestamptz
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(p_is_published, false)
    and p_published_at is not null
    and p_published_at <= now()
    and p_deleted_at is null
$$;

-- unaccent() is only STABLE; this wrapper is safe to use in indexes.
create or replace function private.immutable_unaccent(p_text text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, p_text)
$$;

-- Rough plain-text rendering of MDX/Markdown for search snippets and word
-- counts: drops code fences, JSX tags, math, link targets and markup symbols.
create or replace function private.mdx_to_text(p_mdx text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select trim(regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(coalesce(p_mdx, ''), '```.*?```', ' ', 'gs'),
          '\$\$.*?\$\$', ' ', 'gs'),
        '<[^>]+>', ' ', 'g'),
      '!?\[([^\]]*)\]\([^)]*\)', '\1', 'g'),
    '[#*_>`~|\\$]+', ' ', 'g'),
  '\s+', ' ', 'g'))
$$;

create or replace function private.word_count(p_mdx text)
returns integer
language sql
immutable
parallel safe
set search_path = ''
as $$
  select coalesce(
    array_length(regexp_split_to_array(nullif(private.mdx_to_text(p_mdx), ''), '\s+'), 1),
    0
  )
$$;

grant execute on function private.is_live(boolean, timestamptz, timestamptz)
  to anon, authenticated, service_role;
grant execute on function private.immutable_unaccent(text) to anon, authenticated, service_role;
grant execute on function private.mdx_to_text(text) to anon, authenticated, service_role;
grant execute on function private.word_count(text) to anon, authenticated, service_role;
