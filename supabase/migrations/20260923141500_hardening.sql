-- ─────────────────────────────────────────────────────────────────────────────
-- Hardening pass driven by the Supabase security & performance advisors.
--
-- 1. Function EXECUTE: Postgres grants EXECUTE to PUBLIC globally, which a
--    per-schema ALTER DEFAULT PRIVILEGES cannot revoke. Revoke it globally for
--    functions created by postgres, strip it from every existing public
--    function, then re-grant exactly the intended API surface.
-- 2. Covering indexes for the remaining foreign keys.
-- 3. One SELECT policy per role instead of several permissive ones, so each
--    read evaluates a single predicate.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Function privileges ───────────────────────────────────────────────────
alter default privileges for role postgres revoke execute on functions from public;

revoke execute on all functions in schema public from public, anon, authenticated;

-- Public read API (anon + authenticated)
grant execute on function public.get_assignment_questions(uuid) to anon, authenticated;
grant execute on function public.get_assignment_question_counts(uuid[]) to anon, authenticated;
grant execute on function public.search_content(text, uuid, integer, text, integer) to anon, authenticated;
grant execute on function public.get_route_manifest() to anon, authenticated;
grant execute on function public.get_sitemap_entries() to anon, authenticated;
grant execute on function public.get_week_content_flags(uuid[]) to anon, authenticated;

-- Signed-in users
grant execute on function public.record_reading(text, text, text, uuid) to authenticated;

-- Staff / admin (each re-checks the caller's role internally)
grant execute on function public.staff_refresh_search_index() to authenticated;
grant execute on function public.admin_set_user_role(uuid, public.user_role) to authenticated;
grant execute on function public.admin_metric_series(text, date, date, text) to authenticated;
grant execute on function public.admin_metric_top(text, date, date, integer) to authenticated;
grant execute on function public.admin_overview_totals(date, date) to authenticated;
grant execute on function public.admin_content_performance(date, date, integer) to authenticated;
grant execute on function public.admin_movers(integer, integer) to authenticated;
grant execute on function public.admin_web_vitals(date, date) to authenticated;
grant execute on function public.admin_user_timeline(uuid, timestamptz, integer) to authenticated;
grant execute on function public.admin_refresh_rollups(date, date) to authenticated;

-- Server-side only
grant execute on all functions in schema public to service_role;

-- Private helpers: only what RLS policies and the public API need.
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_live(boolean, timestamptz, timestamptz) to anon, authenticated;
grant execute on function private.is_staff() to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.current_user_role() to anon, authenticated;
grant execute on function private.assert_admin() to authenticated;
grant execute on function private.immutable_unaccent(text) to anon, authenticated;
grant execute on function private.mdx_to_text(text) to anon, authenticated;
grant execute on function private.word_count(text) to anon, authenticated;
grant execute on function private.term_sort_key(text) to anon, authenticated;
grant execute on function private.slugify(text) to anon, authenticated;
grant execute on all functions in schema private to service_role;

-- ── 2. Foreign-key indexes ───────────────────────────────────────────────────
create index if not exists assignments_author_id_idx on public.assignments (author_id);
create index if not exists assignments_reviewer_id_idx on public.assignments (reviewer_id);
create index if not exists notes_author_id_idx on public.notes (author_id);
create index if not exists notes_reviewer_id_idx on public.notes (reviewer_id);
create index if not exists pages_author_id_idx on public.pages (author_id);
create index if not exists pages_reviewer_id_idx on public.pages (reviewer_id);
create index if not exists authors_profile_id_idx on public.authors (profile_id);

-- ── 3. Single SELECT policy per role ─────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['programs', 'courses', 'weeks', 'assignments', 'notes', 'resources', 'faqs', 'pages']
  loop
    execute format('drop policy if exists %I on public.%I', t || ': public reads live rows', t);
    execute format('drop policy if exists %I on public.%I', t || ': staff read all', t);
    execute format(
      'create policy %I on public.%I for select to anon
         using (private.is_live(is_published, published_at, deleted_at))',
      t || ': anon reads live rows', t);
    execute format(
      'create policy %I on public.%I for select to authenticated
         using (private.is_live(is_published, published_at, deleted_at) or (select private.is_staff()))',
      t || ': read live rows, staff read all', t);
  end loop;

  foreach t in array array['nav_items', 'footer_links', 'redirects']
  loop
    execute format('drop policy if exists %I on public.%I', t || ': public reads active', t);
    execute format('drop policy if exists %I on public.%I', t || ': staff read all', t);
    execute format(
      'create policy %I on public.%I for select to anon using (is_active)',
      t || ': anon reads active', t);
    execute format(
      'create policy %I on public.%I for select to authenticated
         using (is_active or (select private.is_staff()))',
      t || ': read active, staff read all', t);
  end loop;
end;
$$;

drop policy if exists "profiles: read own" on public.profiles;
drop policy if exists "profiles: admins read all" on public.profiles;
create policy "profiles: read own, admins read all" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id or (select private.is_admin()));

drop policy if exists "content_feedback: admins read" on public.content_feedback;
drop policy if exists "content_feedback: staff read" on public.content_feedback;
drop policy if exists "content_feedback: read own" on public.content_feedback;
create policy "content_feedback: staff read all, users read own" on public.content_feedback
  for select to authenticated
  using ((select private.is_staff()) or (select auth.uid()) = user_id);

drop policy if exists "event_definitions: admins read" on public.event_definitions;
drop policy if exists "event_definitions: staff read" on public.event_definitions;
create policy "event_definitions: staff read" on public.event_definitions
  for select to authenticated using ((select private.is_staff()));
