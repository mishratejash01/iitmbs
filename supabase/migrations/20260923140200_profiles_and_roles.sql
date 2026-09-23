-- ─────────────────────────────────────────────────────────────────────────────
-- Profiles, roles and the authorisation helpers every RLS policy relies on.
--
-- Roles: student (default) · editor (manages content) · admin (everything,
-- including settings, users and analytics). Authorisation data lives here in
-- public.profiles — never in user-editable auth metadata.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text check (length(full_name) <= 120),
  avatar_url text check (length(avatar_url) <= 1000),
  program_id uuid references public.programs (id) on delete set null,
  current_term public.term_code,
  role public.user_role not null default 'student',
  onboarding_completed boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  marketing_consent boolean not null default false,
  -- true = the student opted in to detailed (identified) analytics.
  analytics_consent boolean not null default false,
  consent_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role) where role <> 'student';
create index profiles_program_id_idx on public.profiles (program_id);
create index profiles_email_trgm_idx on public.profiles using gin (email extensions.gin_trgm_ops);

alter table public.authors
  add constraint authors_profile_id_fkey
  foreign key (profile_id) references public.profiles (id) on delete set null;

create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();

-- ── Authorisation helpers ────────────────────────────────────────────────────
-- SECURITY DEFINER so they can read profiles without recursing through the
-- profiles RLS policies. They live in the unexposed private schema.

create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid())
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role in ('editor', 'admin') from public.profiles p where p.id = (select auth.uid())),
    false
  )
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = (select auth.uid())),
    false
  )
$$;

grant execute on function private.current_user_role() to anon, authenticated, service_role;
grant execute on function private.is_staff() to anon, authenticated, service_role;
grant execute on function private.is_admin() to anon, authenticated, service_role;

-- ── Profile lifecycle ────────────────────────────────────────────────────────

-- Creates the profile when a user signs up (Google fills name and avatar).
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Role changes are only possible for admins (via admin_set_user_role) or for
-- privileged database sessions (SQL editor / migrations), never by a student
-- updating their own row.
create or replace function private.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not private.is_admin() then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role before update on public.profiles
  for each row execute function private.guard_profile_role();

-- Admin RPC to promote/demote users. Admins cannot demote themselves, which
-- prevents accidentally locking everyone out.
create or replace function public.admin_set_user_role(p_user_id uuid, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;
  if p_user_id = (select auth.uid()) and p_role <> 'admin' then
    raise exception 'Admins cannot demote themselves' using errcode = '42501';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
end;
$$;

grant execute on function public.admin_set_user_role(uuid, public.user_role) to authenticated;

-- ── Access control ───────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

grant select on public.profiles to authenticated;
-- Students may edit only these columns of their own row; role is excluded.
grant update (
  full_name, program_id, current_term, onboarding_completed, last_seen_at,
  marketing_consent, analytics_consent, consent_updated_at
) on public.profiles to authenticated;
grant all on public.profiles to service_role;

create policy "profiles: read own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: admins read all" on public.profiles
  for select to authenticated
  using ((select private.is_admin()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
