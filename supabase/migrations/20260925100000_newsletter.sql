-- ─────────────────────────────────────────────────────────────────────────────
-- Newsletter ("Handpicked for your inbox"): one row per email address.
--
-- `segment` is who the reader probably is, judged from where they signed up:
-- a qualifier post gives 'qualifier', a course guide gives that course's
-- level. The source columns keep the exact page so segments can be refined
-- later. The first sign-up wins; signing up again changes nothing.
--
-- Written only by the server (service role) through /api/newsletter; admins
-- can read it. Nothing is exposed to anonymous visitors.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique
    check (length(email) <= 254 and email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  segment text not null default 'general'
    check (segment in ('qualifier', 'foundation', 'diploma', 'degree', 'general')),
  source_path text not null check (source_path ~ '^/' and length(source_path) <= 500),
  source_type text check (length(source_type) <= 40),
  source_entity_id uuid,
  source_category text check (length(source_category) <= 80),
  user_id uuid references public.profiles (id) on delete set null,
  anonymous_id uuid,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

comment on table public.newsletter_subscribers is
  'Newsletter sign-ups. segment = likely audience from the sign-up page (qualifier, foundation, diploma, degree, general).';

create index newsletter_subscribers_segment_idx
  on public.newsletter_subscribers (segment, subscribed_at);
create index newsletter_subscribers_user_id_idx
  on public.newsletter_subscribers (user_id) where user_id is not null;

alter table public.newsletter_subscribers enable row level security;
revoke all on public.newsletter_subscribers from anon, authenticated;
grant all on public.newsletter_subscribers to service_role;

grant select on public.newsletter_subscribers to authenticated;
create policy "newsletter_subscribers: admins read" on public.newsletter_subscribers
  for select to authenticated using ((select private.is_admin()));
