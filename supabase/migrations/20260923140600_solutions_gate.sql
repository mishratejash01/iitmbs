-- ─────────────────────────────────────────────────────────────────────────────
-- Deadline-gated solutions.
--
-- The questions table is not readable by the public at all. Public pages read
-- questions through this function, which:
--   * only serves questions of a live (published) assignment,
--   * returns hints and concepts always,
--   * returns answer_mdx, explanation_mdx and answer_key ONLY once
--     now() >= assignments.solutions_release_at.
-- Staff (editors/admins) previewing an assignment see everything.
-- Because the check runs inside Postgres, the gate cannot be bypassed from the
-- UI, the API or a direct Supabase query with the anon key.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.get_assignment_questions(p_assignment_id uuid)
returns table (
  id uuid,
  "position" smallint,
  question_type public.question_type,
  question_mdx text,
  options jsonb,
  hint_mdx text,
  concept_tags text[],
  difficulty public.difficulty,
  marks numeric,
  solutions_released boolean,
  answer_mdx text,
  explanation_mdx text,
  answer_key jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with target as (
    select
      a.id,
      a.solutions_release_at <= now() as released,
      private.is_staff() as staff
    from public.assignments a
    where a.id = p_assignment_id
      and (
        private.is_live(a.is_published, a.published_at, a.deleted_at)
        or private.is_staff()
      )
  )
  select
    q.id,
    q.position,
    q.question_type,
    q.question_mdx,
    q.options,
    q.hint_mdx,
    q.concept_tags,
    q.difficulty,
    q.marks,
    t.released,
    case when t.released or t.staff then q.answer_mdx end,
    case when t.released or t.staff then q.explanation_mdx end,
    case when t.released or t.staff then q.answer_key end
  from public.questions q
  join target t on t.id = q.assignment_id
  where q.deleted_at is null
  order by q.position
$$;

comment on function public.get_assignment_questions(uuid) is
  'Public read path for questions. Answers, explanations and answer keys are NULL until the assignment''s solutions_release_at.';

grant execute on function public.get_assignment_questions(uuid) to anon, authenticated, service_role;

-- Question counts per assignment (for listings) without exposing any content.
create or replace function public.get_assignment_question_counts(p_assignment_ids uuid[])
returns table (assignment_id uuid, question_count integer)
language sql
stable
security definer
set search_path = ''
as $$
  select q.assignment_id, count(*)::integer
  from public.questions q
  join public.assignments a on a.id = q.assignment_id
  where q.assignment_id = any (p_assignment_ids)
    and q.deleted_at is null
    and (private.is_live(a.is_published, a.published_at, a.deleted_at) or private.is_staff())
  group by q.assignment_id
$$;

grant execute on function public.get_assignment_question_counts(uuid[]) to anon, authenticated, service_role;
