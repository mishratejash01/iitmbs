-- ─────────────────────────────────────────────────────────────────────────────
-- Database security & behaviour tests.
--
-- Run inside a transaction that is rolled back (scripts/test-db.mjs does
-- this), so fixtures never persist:
--   begin; \i security.test.sql; rollback;
-- Every check raises an exception on failure; reaching the final SELECT means
-- all assertions passed.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Fixtures (as the migration owner) ────────────────────────────────────────
insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-4000-8000-00000000a001', 'authenticated', 'authenticated', 'student@test.invalid',
   '{"full_name":"Test Student"}', now(), now()),
  ('00000000-0000-4000-8000-00000000a002', 'authenticated', 'authenticated', 'editor@test.invalid',
   '{"full_name":"Test Editor"}', now(), now());

update public.profiles set role = 'editor' where id = '00000000-0000-4000-8000-00000000a002';

insert into public.event_definitions (name, category, description, store_raw)
values
  ('page_view', 'navigation', 'test', true),
  ('time_on_page', 'content', 'test', false)
on conflict (name) do nothing;

insert into public.programs (id, slug, name, short_name, aliases, is_published)
values
  ('00000000-0000-4000-8000-0000000b0001', 'test-programme', 'Test Programme', 'Test', '{"tp"}', true),
  ('00000000-0000-4000-8000-0000000b0002', 'draft-programme', 'Draft Programme', 'Draft', '{}', false);

insert into public.courses (id, program_id, slug, name, short_name, aliases, is_published)
values ('00000000-0000-4000-8000-0000000c0001', '00000000-0000-4000-8000-0000000b0001',
        'test-maths-1', 'Test Mathematics I', 'Test Maths 1', '{"test math 1","tm1"}', true);

insert into public.weeks (id, course_id, week_number, title, topics, is_published)
values ('00000000-0000-4000-8000-0000000d0001', '00000000-0000-4000-8000-0000000c0001', 1,
        'Zygomorphic Set Theory', '{"sets","relations"}', true);

insert into public.assignments (id, course_id, week_id, type, term, title, due_at, solutions_release_at, is_published)
values
  ('00000000-0000-4000-8000-0000000e0001', '00000000-0000-4000-8000-0000000c0001',
   '00000000-0000-4000-8000-0000000d0001', 'graded', '2026-sep', 'Week 1 Graded Assignment',
   now() + interval '1 day', now() + interval '2 days', true),
  ('00000000-0000-4000-8000-0000000e0002', '00000000-0000-4000-8000-0000000c0001',
   '00000000-0000-4000-8000-0000000d0001', 'practice', '2026-sep', 'Week 1 Practice (draft)',
   null, now(), false);

insert into public.questions (assignment_id, position, question_type, question_mdx, options, hint_mdx,
                              answer_mdx, explanation_mdx, answer_key)
values
  ('00000000-0000-4000-8000-0000000e0001', 1, 'mcq', 'Which set is empty?',
   '[{"id":"a","label_mdx":"{}"},{"id":"b","label_mdx":"{0}"}]', 'Count the elements.',
   'SECRET-ANSWER', 'SECRET-EXPLANATION', '{"correct":["a"]}'),
  ('00000000-0000-4000-8000-0000000e0002', 1, 'numeric', 'Draft question', '[]', null,
   'DRAFT-ANSWER', null, null);

-- ── anon: questions table is unreadable ─────────────────────────────────────
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
begin
  begin
    perform 1 from public.questions limit 1;
    raise exception 'FAIL: anon can select from questions';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

-- ── anon: gated RPC hides answers before release ────────────────────────────
do $$
declare
  r record;
  n integer := 0;
begin
  for r in select * from public.get_assignment_questions('00000000-0000-4000-8000-0000000e0001') loop
    n := n + 1;
    if r.answer_mdx is not null or r.explanation_mdx is not null or r.answer_key is not null then
      raise exception 'FAIL: answers leaked to anon before release';
    end if;
    if r.hint_mdx is null then
      raise exception 'FAIL: hint should be visible before release';
    end if;
    if r.solutions_released then
      raise exception 'FAIL: solutions_released should be false';
    end if;
  end loop;
  if n <> 1 then
    raise exception 'FAIL: expected 1 question for the published GA, got %', n;
  end if;

  select count(*) into n from public.get_assignment_questions('00000000-0000-4000-8000-0000000e0002');
  if n <> 0 then
    raise exception 'FAIL: draft assignment questions visible to anon';
  end if;
end;
$$;

-- ── anon: only live rows, no writes, no analytics ───────────────────────────
do $$
declare
  n integer;
begin
  select count(*) into n from public.programs where slug in ('test-programme', 'draft-programme');
  if n <> 1 then
    raise exception 'FAIL: anon should see exactly the published programme, saw %', n;
  end if;

  select count(*) into n from public.assignments where id = '00000000-0000-4000-8000-0000000e0002';
  if n <> 0 then
    raise exception 'FAIL: anon can see a draft assignment';
  end if;

  begin
    insert into public.programs (slug, name, short_name) values ('hacked', 'Hacked', 'H');
    raise exception 'FAIL: anon inserted a programme';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform 1 from public.events limit 1;
    raise exception 'FAIL: anon can read events';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform public.ingest_events('{}'::jsonb, '[]'::jsonb);
    raise exception 'FAIL: anon can call ingest_events';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform public.check_rate_limit('x', 60, 10);
    raise exception 'FAIL: anon can call check_rate_limit';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform 1 from public.keyword_clusters limit 1;
    raise exception 'FAIL: anon can read keyword research';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;

-- ── student: cannot escalate, sees only own data ────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-4000-8000-00000000a001"}', true);

do $$
declare
  n integer;
  r record;
begin
  begin
    update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-00000000a001';
    raise exception 'FAIL: student changed their own role';
  exception when insufficient_privilege then
    null;
  end;

  update public.profiles set full_name = 'Renamed Student' where id = '00000000-0000-4000-8000-00000000a001';
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'FAIL: student could not update own profile';
  end if;

  select count(*) into n from public.profiles where id = '00000000-0000-4000-8000-00000000a002';
  if n <> 0 then
    raise exception 'FAIL: student can read another profile';
  end if;

  for r in select * from public.get_assignment_questions('00000000-0000-4000-8000-0000000e0001') loop
    if r.answer_mdx is not null then
      raise exception 'FAIL: answers leaked to a signed-in student before release';
    end if;
  end loop;

  insert into public.bookmarks (path, title) values ('/test-programme', 'Test');
  begin
    insert into public.bookmarks (user_id, path, title)
    values ('00000000-0000-4000-8000-00000000a002', '/x', 'Not mine');
    raise exception 'FAIL: student inserted a bookmark for someone else';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform public.admin_overview_totals(current_date - 7, current_date);
    raise exception 'FAIL: student can read admin analytics';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform public.admin_set_user_role('00000000-0000-4000-8000-00000000a001', 'admin');
    raise exception 'FAIL: student promoted themselves';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;

-- ── editor: previews answers, cannot read analytics ─────────────────────────
set local role authenticated;
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-4000-8000-00000000a002"}', true);

do $$
declare
  v_answer text;
  n integer;
begin
  select answer_mdx into v_answer
  from public.get_assignment_questions('00000000-0000-4000-8000-0000000e0001');
  if v_answer is distinct from 'SECRET-ANSWER' then
    raise exception 'FAIL: editor preview should include answers';
  end if;

  select count(*) into n from public.questions;
  if n < 2 then
    raise exception 'FAIL: editor should read all questions (got %)', n;
  end if;

  select count(*) into n from public.events;
  if n <> 0 then
    raise exception 'FAIL: editor should see no analytics rows';
  end if;
end;
$$;

reset role;

-- ── after release: answers become public ────────────────────────────────────
update public.assignments
set due_at = now() - interval '2 hours', solutions_release_at = now() - interval '1 hour'
where id = '00000000-0000-4000-8000-0000000e0001';

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
declare
  r record;
begin
  select * into r from public.get_assignment_questions('00000000-0000-4000-8000-0000000e0001');
  if r.answer_mdx is distinct from 'SECRET-ANSWER' or not r.solutions_released then
    raise exception 'FAIL: answers should be public after release';
  end if;
end;
$$;

reset role;

-- ── integrity: a graded walkthrough cannot unlock before the deadline ───────
do $$
begin
  begin
    update public.assignments
    set due_at = now() + interval '3 days', solutions_release_at = now() + interval '1 day'
    where id = '00000000-0000-4000-8000-0000000e0001';
    raise exception 'FAIL: release before due date was accepted';
  exception when check_violation then
    null;
  end;
end;
$$;

-- ── analytics ingest (service role) ─────────────────────────────────────────
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

do $$
declare
  v_result jsonb;
  n integer;
begin
  v_result := public.ingest_events(
    '{"session_id":"00000000-0000-4000-8000-0000000f0001","anonymous_id":"00000000-0000-4000-8000-0000000f0002",
      "consent_level":"essential","user_id":"00000000-0000-4000-8000-00000000a001","city":"Chennai"}'::jsonb,
    '[{"name":"page_view","path":"/test-programme","page_view_id":"00000000-0000-4000-8000-0000000f0003"},
      {"name":"time_on_page","path":"/test-programme","page_view_id":"00000000-0000-4000-8000-0000000f0003","props":{"seconds":30}},
      {"name":"not_an_event","path":"/"}]'::jsonb
  );
  if (v_result ->> 'skipped')::integer <> 1 then
    raise exception 'FAIL: unknown event should be skipped: %', v_result;
  end if;

  select count(*) into n from public.page_views
  where id = '00000000-0000-4000-8000-0000000f0003' and engaged_seconds = 30
    and user_id is null and city is null;
  if n <> 1 then
    raise exception 'FAIL: essential-consent page view should be pseudonymous with engagement folded in';
  end if;

  if not public.check_rate_limit('test-bucket', 60, 2) or not public.check_rate_limit('test-bucket', 60, 2)
     or public.check_rate_limit('test-bucket', 60, 2) then
    raise exception 'FAIL: rate limiter should allow 2 then block';
  end if;
end;
$$;

reset role;

-- ── search + routing ─────────────────────────────────────────────────────────
select private.refresh_search_index(true);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
declare
  n integer;
  v_manifest jsonb;
begin
  select count(*) into n from public.search_content('zygomorphic');
  if n < 1 then
    raise exception 'FAIL: search should find the week by a title word';
  end if;

  select count(*) into n from public.search_content('zygomorphc');
  if n < 1 then
    raise exception 'FAIL: trigram fallback should tolerate a typo';
  end if;

  v_manifest := public.get_route_manifest();
  if not (v_manifest -> 'courses' ? 'test-programme/test-maths-1') then
    raise exception 'FAIL: manifest missing the live course';
  end if;
  if (v_manifest -> 'course_aliases' ->> 'test-programme/tm1') is distinct from '/test-programme/test-maths-1' then
    raise exception 'FAIL: manifest missing course alias redirect: %', v_manifest -> 'course_aliases';
  end if;
  if v_manifest -> 'programs' ? 'draft-programme' then
    raise exception 'FAIL: manifest leaked a draft programme';
  end if;

  select count(*) into n from public.get_sitemap_entries() where path like '/test-programme%';
  if n < 3 then
    raise exception 'FAIL: sitemap should list programme, course, week and GA (got %)', n;
  end if;
end;
$$;

reset role;

select 'all database security checks passed' as result;
