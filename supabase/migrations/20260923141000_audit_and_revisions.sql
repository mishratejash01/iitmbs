-- ─────────────────────────────────────────────────────────────────────────────
-- Accountability for content and configuration changes.
--
-- audit_log         — who changed what, on every content/config table.
-- content_revisions — full snapshots of notes, questions, assignments and
--                     pages before each edit, so any version can be restored.
-- Both are written only by triggers; nobody can edit or delete them via the API.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  actor_role text,
  table_name text not null,
  record_id text,
  action text not null check (action in ('insert', 'update', 'delete')),
  changed_fields text[] not null default '{}',
  -- { column: [old, new] } for updates; long values are truncated.
  diff jsonb not null default '{}'
);

create index audit_log_occurred_idx on public.audit_log (occurred_at desc);
create index audit_log_record_idx on public.audit_log (table_name, record_id, occurred_at desc);
create index audit_log_actor_idx on public.audit_log (actor_id, occurred_at desc);

create table public.content_revisions (
  id bigint generated always as identity primary key,
  table_name text not null check (table_name in ('notes', 'questions', 'assignments', 'pages')),
  record_id uuid not null,
  revision integer not null,
  snapshot jsonb not null,
  changed_by uuid,
  created_at timestamptz not null default now(),
  unique (table_name, record_id, revision)
);

create index content_revisions_record_idx on public.content_revisions (table_name, record_id, revision desc);

-- Truncates long text values so the audit diff stays small.
create or replace function private.audit_value(p_value jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(p_value) = 'string' and length(p_value #>> '{}') > 280
      then to_jsonb(left(p_value #>> '{}', 280) || '…')
    else p_value
  end
$$;

create or replace function private.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_fields text[] := '{}';
  v_diff jsonb := '{}';
  v_key text;
begin
  -- Counter bumps (download_count) are not edits.
  if tg_op = 'UPDATE' and current_setting('app.counter_update', true) = 'on' then
    return null;
  end if;

  if tg_op = 'UPDATE' then
    for v_key in select jsonb_object_keys(v_new)
    loop
      continue when v_key in ('updated_at', 'updated_by');
      if (v_old -> v_key) is distinct from (v_new -> v_key) then
        v_fields := v_fields || v_key;
        v_diff := v_diff || jsonb_build_object(
          v_key, jsonb_build_array(private.audit_value(v_old -> v_key), private.audit_value(v_new -> v_key))
        );
      end if;
    end loop;
    if cardinality(v_fields) = 0 then
      return null;
    end if;
  end if;

  insert into public.audit_log (actor_id, actor_role, table_name, record_id, action, changed_fields, diff)
  values (
    (select auth.uid()),
    -- Staff role for signed-in users, else the API role (e.g. service_role),
    -- else a direct database session (SQL editor, migrations).
    coalesce(private.current_user_role()::text, auth.jwt() ->> 'role', 'database'),
    tg_table_name,
    coalesce(v_new ->> 'id', v_old ->> 'id', v_new ->> 'name', v_old ->> 'name'),
    lower(tg_op),
    v_fields,
    v_diff
  );
  return null;
end;
$$;

-- Snapshots the previous version of a row before it changes.
create or replace function private.snapshot_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_next integer;
begin
  if to_jsonb(old) - 'updated_at' - 'updated_by' = to_jsonb(new) - 'updated_at' - 'updated_by' then
    return new;
  end if;
  select coalesce(max(revision), 0) + 1 into v_next
  from public.content_revisions
  where table_name = tg_table_name and record_id = old.id;

  insert into public.content_revisions (table_name, record_id, revision, snapshot, changed_by)
  values (tg_table_name, old.id, v_next, to_jsonb(old), (select auth.uid()));
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'programs', 'courses', 'course_programs', 'weeks', 'assignments', 'questions', 'notes', 'resources',
    'faqs', 'pages', 'authors', 'media', 'site_settings', 'nav_items', 'footer_links', 'redirects',
    'seo_overrides', 'keyword_clusters', 'event_definitions'
  ]
  loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function private.audit_row()',
      t || '_audit', t);
  end loop;

  foreach t in array array['notes', 'questions', 'assignments', 'pages']
  loop
    execute format(
      'create trigger %I before update on public.%I
         for each row execute function private.snapshot_revision()',
      t || '_revision', t);
  end loop;
end;
$$;

-- Role changes on profiles are audited too (but not every last_seen bump).
create trigger profiles_role_audit
  after update of role on public.profiles
  for each row
  when (old.role is distinct from new.role)
  execute function private.audit_row();

alter table public.audit_log enable row level security;
alter table public.content_revisions enable row level security;
revoke all on public.audit_log, public.content_revisions from anon, authenticated;
grant select on public.audit_log to authenticated;
grant select on public.content_revisions to authenticated;
grant all on public.audit_log, public.content_revisions to service_role;

create policy "audit_log: admins read" on public.audit_log
  for select to authenticated using ((select private.is_admin()));
create policy "content_revisions: staff read" on public.content_revisions
  for select to authenticated using ((select private.is_staff()));
