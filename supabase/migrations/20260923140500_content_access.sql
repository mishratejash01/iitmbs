-- ─────────────────────────────────────────────────────────────────────────────
-- Access control for content and configuration tables.
--
-- Model
-- * anon / authenticated: read rows that are live (published, published_at in
--   the past, not soft-deleted). Drafts and scheduled rows stay invisible.
-- * editors + admins ("staff"): read everything, create and edit content.
-- * admins only: hard deletes, site settings, navigation, redirects.
-- * questions: no public read at all — see get_assignment_questions().
-- * service_role: full access (server-side jobs only).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Publishable content tables ───────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['programs', 'courses', 'weeks', 'assignments', 'notes', 'resources', 'faqs', 'pages']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);

    execute format(
      'create policy %I on public.%I for select to anon, authenticated
         using (private.is_live(is_published, published_at, deleted_at))',
      t || ': public reads live rows', t);
    execute format(
      'create policy %I on public.%I for select to authenticated
         using ((select private.is_staff()))',
      t || ': staff read all', t);
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
  end loop;
end;
$$;

-- ── Questions: staff only; the public reads them through the gated RPC ───────
alter table public.questions enable row level security;
grant select, insert, update, delete on public.questions to authenticated;
grant all on public.questions to service_role;

create policy "questions: staff read" on public.questions
  for select to authenticated using ((select private.is_staff()));
create policy "questions: staff insert" on public.questions
  for insert to authenticated with check ((select private.is_staff()));
create policy "questions: staff update" on public.questions
  for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "questions: admins delete" on public.questions
  for delete to authenticated using ((select private.is_admin()));

-- ── Reference tables readable by everyone, written by staff ─────────────────
do $$
declare
  t text;
begin
  foreach t in array array['course_programs', 'authors', 'media', 'seo_overrides']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)',
      t || ': public read', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.is_staff()))',
      t || ': staff insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated
         using ((select private.is_staff())) with check ((select private.is_staff()))',
      t || ': staff update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.is_staff()))',
      t || ': staff delete', t);
  end loop;
end;
$$;

-- ── Site-wide configuration: public read, admin write ────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['site_settings', 'nav_items', 'footer_links', 'redirects']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.is_admin()))',
      t || ': admins insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated
         using ((select private.is_admin())) with check ((select private.is_admin()))',
      t || ': admins update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.is_admin()))',
      t || ': admins delete', t);
  end loop;
end;
$$;

create policy "site_settings: public read" on public.site_settings
  for select to anon, authenticated using (true);

create policy "nav_items: public reads active" on public.nav_items
  for select to anon, authenticated using (is_active);
create policy "nav_items: staff read all" on public.nav_items
  for select to authenticated using ((select private.is_staff()));

create policy "footer_links: public reads active" on public.footer_links
  for select to anon, authenticated using (is_active);
create policy "footer_links: staff read all" on public.footer_links
  for select to authenticated using ((select private.is_staff()));

create policy "redirects: public reads active" on public.redirects
  for select to anon, authenticated using (is_active);
create policy "redirects: staff read all" on public.redirects
  for select to authenticated using ((select private.is_staff()));

-- ── Keyword research: staff only ─────────────────────────────────────────────
alter table public.keyword_clusters enable row level security;
grant select, insert, update, delete on public.keyword_clusters to authenticated;
grant all on public.keyword_clusters to service_role;

create policy "keyword_clusters: staff read" on public.keyword_clusters
  for select to authenticated using ((select private.is_staff()));
create policy "keyword_clusters: staff insert" on public.keyword_clusters
  for insert to authenticated with check ((select private.is_staff()));
create policy "keyword_clusters: staff update" on public.keyword_clusters
  for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "keyword_clusters: staff delete" on public.keyword_clusters
  for delete to authenticated using ((select private.is_staff()));

-- Indexes backing the "live rows" predicate on the hot public reads.
create index programs_live_idx on public.programs (sort_order)
  where is_published and deleted_at is null;
create index courses_live_idx on public.courses (program_id, sort_order)
  where is_published and deleted_at is null;
create index weeks_live_idx on public.weeks (course_id, week_number)
  where is_published and deleted_at is null;
create index notes_live_idx on public.notes (course_id, week_id, sort_order)
  where is_published and deleted_at is null;
create index assignments_live_idx on public.assignments (course_id, week_id, type)
  where is_published and deleted_at is null;
create index resources_live_idx on public.resources (course_id, week_id, sort_order)
  where is_published and deleted_at is null;
create index pages_live_idx on public.pages (path)
  where is_published and deleted_at is null;
