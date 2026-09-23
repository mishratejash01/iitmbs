-- ─────────────────────────────────────────────────────────────────────────────
-- Seed data: verified taxonomy, site configuration and starter pages.
--
-- Facts about the qualifier were verified on the official IIT Madras BS pages
-- (study.iitm.ac.in) on 2026-09-23 — see docs/research.md for every source and
-- the items that could not be verified. All prose is original.
--
-- Idempotent: safe to run repeatedly (upserts on natural keys). Notes and
-- assignment bodies are seeded as clearly-marked, UNPUBLISHED drafts so no
-- thin page ever goes live.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Site settings ────────────────────────────────────────────────────────────
insert into public.site_settings (id, data)
values (true, $json${
  "site_name": "Qualifier Hub",
  "tagline": "Week-by-week help for the IIT Madras BS qualifier",
  "description": "An independent study companion for IIT Madras BS qualifier students: weekly graded-assignment concepts and hints, clear notes, formula sheets and qualifier exam preparation for Data Science and Electronic Systems.",
  "base_url": "",
  "locale": "en-IN",
  "current_term": "2026-sep",
  "revalidate_seconds": 3600,
  "theme": {
    "light": {},
    "dark": {}
  },
  "social": {
    "telegram": "",
    "whatsapp": "",
    "youtube": "",
    "instagram": "",
    "x": "",
    "github": ""
  },
  "verification": {
    "google": "",
    "bing": "",
    "yandex": ""
  },
  "contact": {
    "email": "",
    "grievance_officer": ""
  },
  "organization": {
    "name": "Qualifier Hub",
    "legal_name": "",
    "logo_public_id": "",
    "founding_date": "2026"
  },
  "features": {
    "login": true,
    "dark_mode": true,
    "pwa": true,
    "search": true,
    "bookmarks": true,
    "feedback": true,
    "share": true,
    "downloads": true
  },
  "announcement": {
    "enabled": true,
    "text": "September 2026 qualifier: applications close Sun 27 Sep · Week 1 starts Fri 2 Oct",
    "href": "/qualifier/timeline",
    "tone": "info"
  },
  "home": {
    "hero_title": "Clear the IITM BS qualifier, one week at a time",
    "hero_subtitle": "Concepts, hints and practice for every week's graded assignment — with full walkthroughs once the deadline has passed. Free, fast and made for your phone.",
    "popular_paths": [
      "/data-science/maths-1",
      "/data-science/stats-1",
      "/data-science/computational-thinking",
      "/data-science/english-1",
      "/qualifier/eligibility",
      "/qualifier/exam-pattern"
    ]
  },
  "seo": {
    "title_template": "%s | {site_name}",
    "default_title": "IITM BS Qualifier Hub – Weekly Graded Assignment Help, Notes & Exam Prep",
    "default_description": "Week-by-week help for the IIT Madras BS qualifier: graded assignment hints and solutions, notes, formula sheets and exam prep for Data Science and Electronic Systems.",
    "templates": {
      "program": "IITM BS {program} Qualifier – Courses, Week-wise Help & Exam Guide",
      "program_week": "IITM BS Week {n} Graded Assignments {year} – {program}",
      "course": "IITM {short} Notes, Graded Assignments & Exam Prep ({code})",
      "week": "IITM {short} Week {n}: {week_title} – Notes, GA Hints & Practice",
      "graded_assignment": "IITM {short} Week {n} Graded Assignment {year} – Hints & Solutions",
      "graded_assignment_term": "IITM {short} Week {n} Graded Assignment ({term_label}) – Solutions",
      "practice_assignment": "IITM {short} Week {n} Practice Assignment {year} – Explained",
      "practice_assignment_term": "IITM {short} Week {n} Practice Assignment ({term_label})",
      "week_notes": "IITM {short} Week {n} Notes – {week_title}",
      "note": "{note} – IITM {short} Notes",
      "formula_sheet": "IITM {short} Formula Sheet – {course}",
      "exam_prep": "IITM {short} Qualifier Exam Prep – Revision & Practice",
      "page": "{page} | {site_name}"
    },
    "description_templates": {
      "program": "Everything for the IIT Madras BS {program} qualifier: the four courses, week-by-week topics, graded assignment hints and solutions, notes and exam prep.",
      "program_week": "IIT Madras BS {program} week {n}: graded assignment hints and solutions, notes and practice for every qualifier course in one place.",
      "course": "IITM {short} ({course}, {code}) for the BS qualifier: week 1–{weeks} notes, graded assignment hints and solutions, formula sheet and exam prep.",
      "week": "IITM {short} week {n} – {week_title}: clear notes, graded assignment hints, practice questions and resources for the BS qualifier.",
      "graded_assignment": "IITM {short} week {n} graded assignment {year}: the concepts tested, a hint for every question, and step-by-step solutions after the deadline.",
      "practice_assignment": "IITM {short} week {n} practice assignment with hints and fully explained solutions.",
      "week_notes": "IITM {short} week {n} notes – {week_title}, explained step by step with examples for the BS qualifier.",
      "note": "{note}: IITM {short} notes for the BS qualifier, explained step by step.",
      "formula_sheet": "Every IITM {short} ({course}) formula from the qualifier weeks on one printable page.",
      "exam_prep": "Prepare for the IITM {short} part of the BS qualifier exam: what to revise, practice sets and common mistakes."
    }
  },
  "qualifier": {
    "ga_rule": {
      "best_of": 2,
      "first_weeks": 3
    },
    "categories": [
      {
        "id": "general",
        "label": "General",
        "ga_min": 40,
        "course_min": 40,
        "average_min": 50
      },
      {
        "id": "obc_ews",
        "label": "OBC-NCL / EWS",
        "ga_min": 35,
        "course_min": 35,
        "average_min": 45
      },
      {
        "id": "sc_st_pwd",
        "label": "SC / ST / PwD",
        "ga_min": 30,
        "course_min": 30,
        "average_min": 40
      }
    ],
    "course_load": [
      {
        "from": 0,
        "to": 50,
        "courses": 2
      },
      {
        "from": 50,
        "to": 70,
        "courses": 3
      },
      {
        "from": 70,
        "to": 100,
        "courses": 4
      }
    ],
    "source_url": "https://study.iitm.ac.in/ds/admissions.html",
    "verified_on": "2026-09-23"
  },
  "analytics": {
    "retention_months": 13,
    "timezone": "Asia/Kolkata",
    "heartbeat_seconds": 15
  },
  "content": {
    "min_words_warning": 300,
    "stale_days": 90,
    "indexnow_enabled": true
  }
}$json$::jsonb)
on conflict (id) do nothing;

-- ── Authors ──────────────────────────────────────────────────────────────────
insert into public.authors (slug, name, headline, bio)
values (
  'editorial-team',
  'Editorial Team',
  'Qualifier Hub editors',
  'The team behind this site. We check every guide against the official IIT Madras BS pages and show the date each page was last reviewed. Edit this bio in the admin to introduce the people who write and review the content.'
)
on conflict (slug) do nothing;

-- ── Programmes ───────────────────────────────────────────────────────────────
insert into public.programs (slug, name, short_name, aliases, description, official_url, sort_order, is_published)
values
  ('data-science', 'BS in Data Science and Applications', 'Data Science',
   '{"ds","bs ds","bsds","data science and applications","iitm data science","iitm ds"}',
   'The Data Science qualifier is four weeks of real coursework in Mathematics for Data Science I, Statistics for Data Science I, Computational Thinking and English I. Your weekly graded assignment scores decide whether you can sit the in-person qualifier exam. Pick a course below for week-by-week concepts, hints, notes and practice.',
   'https://study.iitm.ac.in/ds/', 1, true),
  ('electronic-systems', 'BS in Electronic Systems', 'Electronic Systems',
   '{"es","bs es","bses","electronics","iitm es","iitm electronic systems"}',
   'The Electronic Systems qualifier is four weeks of coursework in English I, Math for Electronics I, Electronic Systems Thinking and Circuits, and Introduction to C Programming, followed by an in-person qualifier exam for students whose graded assignment scores clear the cut-off.',
   'https://study.iitm.ac.in/es/', 2, true),
  ('management-data-science', 'BS in Management and Data Science', 'Management and Data Science',
   '{"mg","mds","management and data science"}',
   'The Management and Data Science qualifier uses the same four courses as the Data Science qualifier, so every Data Science qualifier page applies to you.',
   'https://study.iitm.ac.in/mg/', 3, false),
  ('aeronautics-space-technology', 'BS in Aeronautics and Space Technology', 'Aeronautics and Space Technology',
   '{"ae","aerospace","aeronautics and space technology"}',
   'The Aeronautics and Space Technology qualifier uses the same four courses as the Electronic Systems qualifier, so every Electronic Systems qualifier page applies to you.',
   'https://study.iitm.ac.in/ae/', 4, false)
on conflict (slug) do nothing;

-- ── Courses ──────────────────────────────────────────────────────────────────
insert into public.courses (program_id, slug, name, short_name, code, aliases, description, official_url, credits, weeks_count, sort_order, is_published)
select p.id, c.slug, c.name, c.short_name, c.code, c.aliases, c.description, c.official_url, 4, 4, c.sort_order, true
from (values
  ('data-science', 'maths-1', 'Mathematics for Data Science I', 'Maths 1', 'BSMA1001',
   '{"maths 1","math 1","maths1","math1","maths","math","mathematics 1","mathematics i","mathematics for data science 1","mathematics for data science i","m1","ma1","bsma1001"}'::text[],
   'Mathematics for Data Science I builds the algebra-and-functions toolkit the rest of the degree leans on. The four qualifier weeks cover sets, relations and functions; straight lines and slope; quadratic functions; and the algebra and graphs of polynomials.',
   'https://study.iitm.ac.in/ds/course_pages/BSMA1001.html', 1),
  ('data-science', 'stats-1', 'Statistics for Data Science I', 'Stats 1', 'BSMA1002',
   '{"stats 1","stat 1","stats1","stat1","stats","statistics","statistics 1","statistics i","statistics for data science 1","statistics for data science i","s1","bsma1002"}'::text[],
   'Statistics for Data Science I teaches you to describe data before you model it. The qualifier weeks move from types of data and scales of measurement to summarising categorical and numerical data, and then to measuring how two variables move together.',
   'https://study.iitm.ac.in/ds/course_pages/BSMA1002.html', 2),
  ('data-science', 'computational-thinking', 'Computational Thinking', 'CT', 'BSCS1001',
   '{"ct","comp thinking","computational thinking","bscs1001"}'::text[],
   'Computational Thinking trains you to break problems into steps a computer could follow — variables, iteration, filtering and procedures — using flowcharts and pseudocode on small datasets. No programming language is needed for the qualifier weeks.',
   'https://study.iitm.ac.in/ds/course_pages/BSCS1001.html', 3),
  ('data-science', 'english-1', 'English I', 'English 1', 'BSHS1001',
   '{"english 1","english i","eng 1","english1","eng1","bshs1001"}'::text[],
   'English I sharpens the English you will read, write and speak throughout the degree: sounds and words, parts of speech, sentences with phrases and idioms, and the basics of spoken English.',
   'https://study.iitm.ac.in/ds/course_pages/BSHS1001.html', 4),
  ('electronic-systems', 'english-1', 'English I', 'English 1', 'HS1101',
   '{"english 1","english i","eng 1","english1","eng1","es english","hs1101"}'::text[],
   'English I for Electronic Systems covers sounds and words, parts of speech and articles, vocabulary with phrasal and modal verbs, and spoken and telephone English.',
   'https://study.iitm.ac.in/es/course_pages/HS1101.html', 1),
  ('electronic-systems', 'math-for-electronics-1', 'Math for Electronics I', 'MfE 1', 'MA1101',
   '{"math for electronics 1","maths for electronics 1","math for electronics i","mfe 1","mfe1","es maths 1","es maths","es math","maths 1","math 1","ma1101"}'::text[],
   'Math for Electronics I starts from functions and straight lines, solves systems of linear equations with matrices, and then introduces sequences, limits and continuity — the groundwork for circuits and signals.',
   'https://study.iitm.ac.in/es/course_pages/MA1101.html', 2),
  ('electronic-systems', 'estc', 'Electronic Systems Thinking and Circuits', 'ESTC', 'EE1101',
   '{"electronic systems thinking and circuits","electronic systems thinking","est and c","est&c","ee1101","circuits"}'::text[],
   'Electronic Systems Thinking and Circuits begins by taking a phone apart and asking how each piece works, then builds circuit fundamentals — voltage, current, Ohm''s law, Kirchhoff''s laws, nodal and mesh analysis — and applies them to microphones, motors and resistive networks.',
   'https://study.iitm.ac.in/es/course_pages/EE1101.html', 3),
  ('electronic-systems', 'c-programming', 'Introduction to C Programming', 'C Programming', 'CS1101',
   '{"c programming","intro to c","introduction to c","introduction to c programming","c prog","cs1101"}'::text[],
   'Introduction to C Programming begins with how a computer represents numbers, characters and instructions, then moves to your first C programs: variables, operators, expressions and control flow.',
   'https://study.iitm.ac.in/es/course_pages/CS1101.html', 4)
) as c (program_slug, slug, name, short_name, code, aliases, description, official_url, sort_order)
join public.programs p on p.slug = c.program_slug
on conflict (program_id, slug) where deleted_at is null do nothing;

-- Cross-listing: MG uses the DS qualifier courses, AE uses the ES ones.
insert into public.course_programs (program_id, course_id, sort_order)
select target.id, c.id, c.sort_order
from public.courses c
join public.programs home on home.id = c.program_id
join public.programs target on target.slug = case home.slug
  when 'data-science' then 'management-data-science'
  when 'electronic-systems' then 'aeronautics-space-technology'
end
on conflict (program_id, course_id) do nothing;

-- ── Weeks (official week 1–4 topics, verified 2026-09-23) ───────────────────
insert into public.weeks (course_id, week_number, title, summary, topics, is_published)
select c.id, w.n, w.title, w.summary, w.topics, true
from (values
  ('data-science', 'maths-1', 1, 'Set Theory',
   'Number systems, sets and set operations, relations and their types, and functions and their types.',
   '{"Number systems","Sets and set operations","Relations and their types","Functions and their types"}'::text[]),
  ('data-science', 'maths-1', 2, 'Straight Lines',
   'The rectangular coordinate system, slope, parallel and perpendicular lines, the forms of a line''s equation and fitting a straight line to data.',
   '{"Rectangular coordinate system","Slope of a line","Parallel and perpendicular lines","Representations of a line","General equation of a line","Straight-line fit"}'::text[]),
  ('data-science', 'maths-1', 3, 'Quadratic Functions',
   'Quadratic functions, their vertex, minima and maxima, slope, and solving quadratic equations.',
   '{"Quadratic functions","Minima, maxima and vertex","Slope of a quadratic","Quadratic equations"}'::text[]),
  ('data-science', 'maths-1', 4, 'Algebra of Polynomials',
   'Adding, subtracting, multiplying and dividing polynomials, and reading their graphs: x-intercepts, multiplicities, end behaviour and turning points.',
   '{"Polynomial arithmetic","Polynomial division algorithms","X-intercepts and multiplicities","End behaviour and turning points","Graphing and building polynomials"}'::text[]),

  ('data-science', 'stats-1', 1, 'Introduction and Types of Data',
   'What statistics is for, the kinds of data you will meet, descriptive versus inferential statistics and scales of measurement.',
   '{"Types of data","Descriptive and inferential statistics","Scales of measurement"}'::text[]),
  ('data-science', 'stats-1', 2, 'Describing Categorical Data',
   'Frequency distributions for categorical data, graphing them well, and the mode and median of a categorical variable.',
   '{"Frequency distributions","Graphing categorical data","Mode and median of categorical data"}'::text[]),
  ('data-science', 'stats-1', 3, 'Describing Numerical Data',
   'Frequency tables, measures of central tendency, quartiles and percentiles, measures of spread and the five-number summary.',
   '{"Frequency tables for numerical data","Mean, median and mode","Quartiles and percentiles","Range, variance, standard deviation and IQR","Five-number summary"}'::text[]),
  ('data-science', 'stats-1', 4, 'Association Between Two Variables',
   'Association between two categorical variables with contingency tables, and between two numerical variables with scatterplots, covariance and correlation.',
   '{"Contingency tables and relative frequencies","Scatterplots","Covariance","Pearson correlation coefficient","Point bi-serial correlation"}'::text[]),

  ('data-science', 'computational-thinking', 1, 'Variables, Iterators and Filtering',
   'Variables and initialisation, iterating over a dataset, filtering, data types, flowcharts and checking data for sanity.',
   '{"Variables and initialisation","Iterators","Filtering","Data types","Flowcharts","Sanity of data"}'::text[]),
  ('data-science', 'computational-thinking', 2, 'Iteration, Selection and Pseudocode',
   'Iteration with filtering and selection, writing pseudocode, finding the maximum and minimum, and the AND operator.',
   '{"Iteration and filtering","Selection","Pseudocode","Finding maximum and minimum","AND operator"}'::text[]),
  ('data-science', 'computational-thinking', 3, 'Multiple Iterations and Procedures',
   'Several (non-nested) passes over data, the three-prizes problem, procedures with parameters, side effects and the OR operator.',
   '{"Multiple non-nested iterations","Three prizes problem","Procedures and parameters","Side effects","OR operator"}'::text[]),
  ('data-science', 'computational-thinking', 4, 'Nested Iterations',
   'Nested iterations, the birthday paradox and binning data to cut down comparisons.',
   '{"Nested iterations","Birthday paradox","Binning"}'::text[]),

  ('data-science', 'english-1', 1, 'Sounds and Words',
   'Vowel and consonant sounds of English and how they shape words.',
   '{"Vowel sounds","Consonant sounds"}'::text[]),
  ('data-science', 'english-1', 2, 'Parts of Speech',
   'The parts of speech and how each one works in a sentence.',
   '{"Parts of speech"}'::text[]),
  ('data-science', 'english-1', 3, 'Sentences, Phrases and Idioms',
   'Building sentences, using phrases correctly and understanding common idioms.',
   '{"Sentences","Phrases","Idioms"}'::text[]),
  ('data-science', 'english-1', 4, 'Speaking Skills',
   'The preliminaries of spoken English.',
   '{"Spoken English preliminaries"}'::text[]),

  ('electronic-systems', 'english-1', 1, 'Sounds and Words',
   'Vowel and consonant sounds of English and how they shape words.',
   '{"Vowel sounds","Consonant sounds"}'::text[]),
  ('electronic-systems', 'english-1', 2, 'Parts of Speech and Articles',
   'The parts of speech and the correct use of articles.',
   '{"Parts of speech","Articles"}'::text[]),
  ('electronic-systems', 'english-1', 3, 'Words and Phrases',
   'Vocabulary, phrasal verbs, modal verbs and idioms.',
   '{"Vocabulary","Phrasal verbs","Modal verbs","Idioms"}'::text[]),
  ('electronic-systems', 'english-1', 4, 'Speaking Skills',
   'Spoken English preliminaries and telephone English.',
   '{"Spoken English preliminaries","Telephone English"}'::text[]),

  ('electronic-systems', 'math-for-electronics-1', 1, 'Numbers, Variables, Functions and Equations',
   'Visualising expressions and equations, functions of one variable and straight lines.',
   '{"Visualising expressions and equations","Functions of one variable","Straight lines"}'::text[]),
  ('electronic-systems', 'math-for-electronics-1', 2, 'Systems of Linear Equations',
   'Solving two linear equations, writing systems in matrix form and solving m equations in n variables.',
   '{"Systems of two linear equations","Matrix representation","m equations in n variables"}'::text[]),
  ('electronic-systems', 'math-for-electronics-1', 3, 'Sequences and Limits',
   'Bounded, monotonic, convergent and divergent sequences, computing limits and the monotone convergence theorem.',
   '{"Bounded and monotonic sequences","Convergent and divergent sequences","Limit of a sequence","Computing limits","Monotone convergence theorem"}'::text[]),
  ('electronic-systems', 'math-for-electronics-1', 4, 'Limits of Functions and Continuity',
   'Limits and continuity of functions including powers and exponentials, one-sided limits and limits at infinity.',
   '{"Limit of a function","Continuity","Powers and exponentials","One-sided limits","Limits at infinity"}'::text[]),

  ('electronic-systems', 'estc', 1, 'Mobile Teardown and the Resistor',
   'Miniaturisation in electronics, a mobile phone teardown, the battery and charger, back-of-the-envelope estimates and the theory of the resistor.',
   '{"Miniaturisation of electronic packaging","Mobile teardown","Battery and charger","Back-of-the-envelope calculations","The resistor"}'::text[]),
  ('electronic-systems', 'estc', 2, 'Voltage, Current and Circuit Analysis',
   'Voltage, current and Ohm''s law, sources in series and parallel, I-V characteristics, nodal analysis with KCL, mesh analysis with KVL, and first looks at capacitors and inductors.',
   '{"Voltage and current","Ohm''s law","Series and parallel sources","I-V characteristics","Nodal analysis and KCL","Mesh analysis and KVL","Series and parallel resistors","Capacitors and inductors"}'::text[]),
  ('electronic-systems', 'estc', 3, 'Dial, Talk and Hear',
   'How a phone call works: the microphone, motors and generators, the sinusoid, energy in time-varying signals, harmonics and household electricity.',
   '{"The microphone","Motor and generator","The sinusoid","Energy of time-varying signals","Harmonics","Electricity consumption at home"}'::text[]),
  ('electronic-systems', 'estc', 4, 'Problem Solving with Resistive Circuits',
   'Structured problem solving: bounds, resistive ladders, the Wheatstone bridge and the resistive cube.',
   '{"Lower and upper bounds","Resistive ladder","Wheatstone bridge","Resistive cube"}'::text[]),

  ('electronic-systems', 'c-programming', 1, 'How a Computer Works',
   'Memory and computation, split memory architecture, loops and branches, input and output, what programming is and a first look at C.',
   '{"Memory and computation","Split memory architecture","Loops, conditions and branches","Memory and the outside world","What is programming","Introduction to C"}'::text[]),
  ('electronic-systems', 'c-programming', 2, 'Data Representation',
   'How computers represent integers, negative and hexadecimal numbers, floating-point numbers, characters and instructions, plus compilation and the role of the operating system.',
   '{"Number representation","Negative numbers and hexadecimal","Floating-point representation","Character encoding","Instruction encoding","Compilation","Role of the operating system"}'::text[]),
  ('electronic-systems', 'c-programming', 3, 'Introduction to C Programming',
   'The structure of a C program, variables, operators and expressions.',
   '{"Structure of a C program","Variables","Operators","Expressions"}'::text[]),
  ('electronic-systems', 'c-programming', 4, 'Control Statements',
   'Structured programming and control flow in C: if-else-if, switch, and for and while loops.',
   '{"Structured programming","Control flow","if-else-if and switch","for and while loops"}'::text[])
) as w (program_slug, course_slug, n, title, summary, topics)
join public.programs p on p.slug = w.program_slug
join public.courses c on c.program_id = p.id and c.slug = w.course_slug
on conflict (course_id, week_number) where deleted_at is null do nothing;

-- ── Draft placeholders (UNPUBLISHED) ─────────────────────────────────────────
-- One notes page and one graded assignment per week, so editors fill in a
-- ready-made structure. solutions_release_at is far in the future on purpose
-- (fail-closed) — set the real deadline and release time before publishing.
insert into public.notes (course_id, week_id, kind, slug, title, summary, body_mdx, author_id, source_permission, is_published)
select
  w.course_id, w.id, 'week', 'week-' || w.week_number || '-notes',
  c.short_name || ' Week ' || w.week_number || ': ' || w.title,
  w.summary,
  $md$<Callout type="warning">DRAFT — replace this placeholder with original notes before publishing.</Callout>

## Overview

## Key ideas

## Worked examples

## Common mistakes

## Quick recap
$md$,
  (select id from public.authors where slug = 'editorial-team'),
  'original', false
from public.weeks w
join public.courses c on c.id = w.course_id
where not exists (select 1 from public.notes n where n.week_id = w.id and n.kind = 'week' and n.deleted_at is null);

insert into public.assignments (course_id, week_id, type, term, title, summary, intro_mdx, due_at, solutions_release_at, author_id, source_permission, is_published)
select
  w.course_id, w.id, 'graded', '2026-sep',
  'Week ' || w.week_number || ' Graded Assignment',
  'Concepts, hints and practice for the ' || c.short_name || ' week ' || w.week_number || ' graded assignment.',
  $md$<Callout type="warning">DRAFT — add the concepts tested, per-question hints and walkthroughs, then set the due date and release time.</Callout>
$md$,
  null, '2099-01-01T00:00:00+05:30',
  (select id from public.authors where slug = 'editorial-team'),
  'original', false
from public.weeks w
join public.courses c on c.id = w.course_id
on conflict (week_id, type, term) where deleted_at is null and week_id is not null do nothing;

insert into public.notes (course_id, kind, slug, title, summary, body_mdx, author_id, source_permission, is_published)
select c.id, k.kind::public.note_kind, k.slug, c.name || ' ' || k.label, k.summary,
  $md$<Callout type="warning">DRAFT — replace this placeholder with original content before publishing.</Callout>
$md$,
  (select id from public.authors where slug = 'editorial-team'), 'original', false
from public.courses c
cross join (values
  ('formula_sheet', 'formula-sheet', 'Formula Sheet', 'Every formula from the qualifier weeks on one page.'),
  ('exam_prep', 'qualifier-exam-prep', 'Qualifier Exam Preparation', 'What to revise, how to practise and the mistakes to avoid.')
) as k (kind, slug, label, summary)
where (k.kind <> 'formula_sheet' or c.code in ('BSMA1001', 'BSMA1002', 'MA1101', 'EE1101'))
  and not exists (
    select 1 from public.notes n where n.course_id = c.id and n.kind = k.kind::public.note_kind and n.deleted_at is null
  );

-- ── CMS pages ────────────────────────────────────────────────────────────────
insert into public.pages (path, title, summary, body_mdx, sources, template, author_id, last_reviewed_at, sort_order, is_published, seo_title, seo_description)
values
('qualifier', 'IITM BS Qualifier: How It Works',
 'A plain-English guide to the IIT Madras BS qualifier — the four weeks, the graded assignments, the exam and what happens after.',
 $md$The qualifier is how most students enter the IIT Madras BS programmes. Instead of a one-day entrance test, you study four weeks of real course content, submit a graded assignment every week, and — if your scores are high enough — sit one in-person qualifier exam. Clear it and you can register for Foundation-level courses.

## The process at a glance

1. **Apply** for a term (January, May or September) and pay the application fee.
2. **Study weeks 1–4** of the four qualifier courses for your programme.
3. **Submit the weekly graded assignments (GAs).** In each course, the average of your best two of the first three GA scores decides whether you get a hall ticket.
4. **Write the qualifier exam** — one four-hour, in-person exam covering all four courses.
5. **Clear the cut-offs** — a minimum score in every course and a minimum overall average — to receive admission to the Foundation level.

## Which courses are in the qualifier?

| Programme | Qualifier courses |
|---|---|
| Data Science and Applications | Mathematics for Data Science I, Statistics for Data Science I, Computational Thinking, English I |
| Electronic Systems | English I, Math for Electronics I, Electronic Systems Thinking and Circuits, Introduction to C Programming |

The BS in Management and Data Science uses the Data Science qualifier courses, and the BS in Aeronautics and Space Technology uses the Electronic Systems ones.

## Guides

- <RelatedLink href="/qualifier/eligibility" />
- <RelatedLink href="/qualifier/exam-pattern" />
- <RelatedLink href="/qualifier/syllabus" />
- <RelatedLink href="/qualifier/timeline" />
- <RelatedLink href="/qualifier/ga-calculator" />
- <RelatedLink href="/qualifier/score-calculator" />

## How to use this site during the qualifier

Each course has a page for every week. Before the GA deadline you'll find the concepts each question tests, a hint for every question and practice questions to check yourself. Full worked walkthroughs appear only **after** the official deadline, so the site helps you learn without undermining the honour code.

<Callout type="info">
This is an independent study resource and is not affiliated with IIT Madras. Rules can change between terms — confirm dates and numbers on the official admissions page before relying on them.
</Callout>
$md$,
 '[{"title":"Data Science admissions — IIT Madras","url":"https://study.iitm.ac.in/ds/admissions.html"},{"title":"Electronic Systems admissions — IIT Madras","url":"https://study.iitm.ac.in/es/admissions.html"},{"title":"Data Science academics — IIT Madras","url":"https://study.iitm.ac.in/ds/academics.html"}]',
 'guide', (select id from public.authors where slug = 'editorial-team'), '2026-09-23', 1, true,
 'IITM BS Qualifier Explained — Process, Courses, Exam and Cut-offs',
 'How the IIT Madras BS qualifier works: four weeks of coursework, weekly graded assignments, the 4-hour exam, cut-offs and what happens after.'),

('qualifier/eligibility', 'Qualifier Eligibility: Who Can Apply and Who Gets a Hall Ticket',
 'Who can apply for the IIT Madras BS qualifier, what it costs, and the graded-assignment rule that decides who sits the exam.',
 $md$There are two separate questions: can you **apply** for the qualifier, and will your **graded assignment scores** earn you a hall ticket for the exam?

## Who can apply

**Data Science and Applications** — anyone who has passed Class 12 or an equivalent, from any stream and at any age, having studied Mathematics and English in Class 10. Students who have finished their Class 11 exams can also apply; they join the programme only after passing Class 12.

**Electronic Systems** — anyone who has passed Class 12 or an equivalent **with Physics and Mathematics**, at any age. Class 11 students with Physics and Mathematics may also apply and join after Class 12.

## Application fee

| Category | Fee |
|---|---|
| General / OBC | ₹4,000 |
| SC / ST / PwD (40% or more) | ₹2,000 |
| SC / ST who are also PwD | ₹1,000 |

The fee is not refundable. An extra facilitation fee applies if you choose an exam centre outside India.

## The hall-ticket rule

In **each** of the four courses, take the average of your **best two of the first three** weekly graded assignment scores. That average must reach the minimum for your category in every course:

| Category | Minimum GA average in each course |
|---|---|
| General | 40% |
| OBC-NCL / EWS | 35% |
| SC / ST / PwD | 30% |

An assignment you do not attempt counts as zero, so skipping a week makes the rule much harder to meet.

<Callout type="tip">
The Student Handbook describes a two-stage version of this rule. If the average of your **week 1 and week 2** scores already clears the cut-off in all four courses, you can write the first qualifier exam of the term. If not, your best two of the first three weeks decide whether you can write the second exam in the same term. Check the handbook for your term before planning around it.
</Callout>

## Direct entry without the qualifier

Candidates who were eligible to write the most recent JEE Advanced can join the Foundation level directly by paying the admission fee and uploading proof — no qualifier needed.

## Related

- <RelatedLink href="/qualifier/exam-pattern" />
- <RelatedLink href="/qualifier/timeline" />
$md$,
 '[{"title":"Data Science admissions — IIT Madras","url":"https://study.iitm.ac.in/ds/admissions.html"},{"title":"Electronic Systems admissions — IIT Madras","url":"https://study.iitm.ac.in/es/admissions.html"},{"title":"BS Data Science Student Handbook","url":"https://docs.google.com/document/d/e/2PACX-1vRxGnnDCVAO3KX2CGtMIcJQuDrAasVk2JHbDxkjsGrTP5ShhZK8N6ZSPX89lexKx86QPAUswSzGLsOA/pub"}]',
 'guide', (select id from public.authors where slug = 'editorial-team'), '2026-09-23', 2, true,
 'IITM BS Qualifier Eligibility, Fees and the GA Hall-Ticket Rule',
 'Who can apply for the IIT Madras BS qualifier, the ₹4,000 fee and concessions, and the best-2-of-3 graded assignment rule for a hall ticket.'),

('qualifier/exam-pattern', 'Qualifier Exam Pattern, Cut-offs and Re-attempts',
 'The format of the IIT Madras BS qualifier exam, the pass marks by category, re-attempts and what your score unlocks.',
 $md$## Format

- **One exam, four courses.** A single in-person, invigilated exam covers all four qualifier courses of your programme.
- **Four hours** long.
- **Where:** at exam centres in the cities you chose while applying. There are also centres in the UAE, Sri Lanka, Bahrain, Kuwait and Oman; candidates elsewhere abroad take a remote-proctored exam.
- **Question types:** IIT Madras does not publish a breakdown. The weekly graded assignments use multiple-choice, multiple-select and numerical-answer questions, so practise in those formats.

## Cut-offs to pass

You need **both** a minimum score in every course **and** a minimum average across the four courses:

| Category | Minimum in each course | Minimum average |
|---|---|---|
| General | 40% | 50% |
| OBC-NCL / EWS | 35% | 45% |
| SC / ST / PwD | 30% | 40% |

These relaxations apply to the qualifier only, not to courses after you join. The cut-offs are the same for Data Science and Electronic Systems.

## If you don't clear it

If you had a hall ticket but failed or missed the exam, you can **re-attempt in the same term** without redoing the assignments. The re-attempt fee is ₹2,000 (General/OBC), ₹1,000 (SC/ST/PwD) or ₹500 (SC/ST who are also PwD). If you never got a hall ticket, you apply again in a later term and redo the four weeks.

## What your score unlocks

Clearing the qualifier admits you to the **Foundation level**. Your average qualifier score also sets how many courses you may take in your first term:

| Average qualifier score | Courses in the first term |
|---|---|
| From the cut-off up to 50% | up to 2 |
| 50% to 70% | up to 3 |
| 70% and above | up to 4 |

If you register in the same term as your qualifier, your qualifier exam score counts as Quiz 1 for those courses.

<Callout type="info">
How long a qualifier result stays valid is described differently on different official pages (the Student Handbook says three terms). Check the validity stated in your own admission letter.
</Callout>

## Related

- <RelatedLink href="/qualifier/eligibility" />
- <RelatedLink href="/qualifier/timeline" />
$md$,
 '[{"title":"Data Science admissions — IIT Madras","url":"https://study.iitm.ac.in/ds/admissions.html"},{"title":"Electronic Systems admissions — IIT Madras","url":"https://study.iitm.ac.in/es/admissions.html"},{"title":"BS Data Science Student Handbook","url":"https://docs.google.com/document/d/e/2PACX-1vRxGnnDCVAO3KX2CGtMIcJQuDrAasVk2JHbDxkjsGrTP5ShhZK8N6ZSPX89lexKx86QPAUswSzGLsOA/pub"}]',
 'guide', (select id from public.authors where slug = 'editorial-team'), '2026-09-23', 3, true,
 'IITM BS Qualifier Exam Pattern and Cut-offs (40/50) Explained',
 'The IIT Madras BS qualifier exam: one 4-hour in-person paper, category-wise cut-offs, same-term re-attempts and the course limit your score unlocks.'),

('qualifier/timeline', 'September 2026 Qualifier Timeline',
 'Key dates for the September 2026 IIT Madras BS qualifier — applications, the four weeks and every qualifier exam.',
 $md$These dates come from the official *Important Dates* table on the IIT Madras BS admissions pages and apply to both Data Science and Electronic Systems.

| What | Date |
|---|---|
| Applications close | Sun 27 Sep 2026 |
| Week 1 of the qualifier starts | Fri 2 Oct 2026 |
| Qualifier exam (first exam) | Sun 15 Nov 2026 |
| Results; course registration opens | Thu 19 Nov 2026 |
| Next qualifier exam (and first re-attempt) | Sat 5 Dec 2026 |
| Results | Wed 9 Dec 2026 |
| Final re-attempt exam | Sun 10 Jan 2027 |
| Final results | Thu 14 Jan 2027 |

Weekly graded assignment deadlines are published on the course portal once the term starts; each course's week pages here show them when they are announced.

<Callout type="warning">
The official academic calendar image and the admissions table differ on a few dates (for example, the calendar lists the December re-attempt results on 15 Dec). When in doubt, trust the date shown in your own dashboard on the IIT Madras portal.
</Callout>

## Before week 1

- **Finish your application** before it closes and keep the payment receipt.
- **Know your four courses.** Open your programme page — Data Science or Electronic Systems — and skim the week 1 topics of each course.
- **Understand the hall-ticket rule** now, not after week 3: your best two of the first three graded assignments in every course decide whether you can sit the exam.

## During the four weeks

Each week follows the same rhythm: watch the lectures, try the practice and activity questions, then submit the graded assignment before its deadline. Treat weeks 1 and 2 as the attempts that count and keep week 3 as your safety net. The GA calculator shows where you stand after each week.

## Before the exam

The exam covers weeks 1–4 of every course. From week 4, revise with each course's formula sheet and exam-prep page, and check the pass marks so you know the score you need in your weakest course.

## Related

- <RelatedLink href="/qualifier/eligibility" />
- <RelatedLink href="/qualifier/ga-calculator" />
- <RelatedLink href="/qualifier/syllabus" />
- <RelatedLink href="/qualifier/exam-pattern" />
$md$,
 '[{"title":"Data Science admissions — Important Dates","url":"https://study.iitm.ac.in/ds/admissions.html"},{"title":"Academic calendar — IIT Madras BS","url":"https://study.iitm.ac.in/ds/academic_calendar.html"}]',
 'guide', (select id from public.authors where slug = 'editorial-team'), '2026-09-23', 4, true,
 'IITM BS Qualifier Sep 2026 Dates — Deadline, Week 1 and Exam',
 'September 2026 IIT Madras BS qualifier timeline: applications close 27 Sep, week 1 starts 2 Oct, qualifier exam 15 Nov, plus re-attempt dates.'),

('about', 'About',
 'Who we are, how our content is made and why walkthroughs appear only after deadlines.',
 $md$<SiteName /> is an independent study companion for students in the IIT Madras BS qualifier. We are not affiliated with, endorsed by or connected to IIT Madras.

## What we do

The qualifier moves fast: four courses, four weeks and a graded assignment every week. We organise everything by course and week so you can find the right page in seconds, on any phone and any network.

- **Concepts and hints first.** Before a graded assignment is due, each page explains the concepts it tests and gives a hint for every question — enough to get unstuck without handing you the answer.
- **Walkthroughs after the deadline.** Full worked solutions appear only once the official deadline has passed. This is enforced by our database, not just hidden in the page.
- **Notes, formula sheets and exam prep** for every qualifier course.

## How our content is made

Everything here is either written by our team, shared with the author's permission, or a link to an official source summarised in our own words. We never copy other websites. If you believe something here is yours and was used without permission, please <ContactLink>contact us</ContactLink> and we will review it promptly.

## Where to start

New to the qualifier? Read <RelatedLink href="/qualifier" />, then open your programme's course pages. How we handle your data is explained in the [privacy policy](/privacy), and the rules for using the site are in the [terms of use](/terms).

## Accessibility

Every page is built to meet WCAG 2.2 AA: readable contrast in light and dark mode, full keyboard support, maths rendered as text rather than images, and layouts that work on a 360-pixel phone screen. If something is hard to use, please tell us.

## Accuracy

We check our pages against the official syllabus and admissions pages and show a "last reviewed" date on each guide. If you spot a mistake, use the feedback box at the bottom of any page.
$md$,
 '[]', 'default', null, '2026-09-23', 10, true, null,
 'An independent study companion for IIT Madras BS qualifier students — how our notes and walkthroughs are made and why solutions wait for deadlines.'),

('privacy', 'Privacy Policy',
 'What we collect, why, how long we keep it and how to download or delete your data.',
 $md$*Last updated: 23 September 2026*

This policy explains what personal data <SiteName /> ("we") collects when you use the site, why, how long we keep it and the choices you have. It is written to meet India's Digital Personal Data Protection Act, 2023.

## Summary

- You can read everything on the site **without an account**.
- We run **essential analytics** that are pseudonymous: they tell us which pages help students, but they are not linked to your name or email.
- **Detailed analytics**, linked to your account, are **off unless you opt in**.
- We **never store your IP address**, never sell data and never show ads.
- You can **download** or **delete** your data at any time from your dashboard.

## What we collect

### 1. Essential analytics (always on)

To keep the site working, secure and useful we record:

- a random identifier stored in a first-party cookie (`qh_aid`) and a session identifier (`qh_sid`);
- the pages you view, the page that referred you, and campaign tags in the link (UTM parameters);
- how you use a page: scroll depth, time spent while the tab is visible, table-of-contents and link clicks, hint reveals, walkthrough views, copy actions, downloads and searches you type into our search box;
- your device type, browser, operating system and screen size;
- your approximate location at country and state level, derived from your IP address by our hosting provider;
- page performance measurements (Core Web Vitals) and error reports.

Your IP address is used only momentarily to derive the approximate location and a **one-way hash that changes every day**, which we use to prevent abuse. The address itself is never written to our database.

### 2. Detailed analytics (only if you opt in)

If you are signed in, are 18 or older, and choose **detailed analytics**, the same events are linked to your account and include your city. This lets us show you your reading history and progress, and helps us understand how students move through the course. You can switch it off at any time; we then stop linking new events to your account.

### 3. Your account

If you sign in with Google we receive your name, email address and profile picture. We also store the programme and term you choose, your bookmarks, reading history, progress ticks, and your consent choices.

### 4. Feedback

If you answer "Was this helpful?" or leave a comment, we store your answer, the page and — if you are signed in — your account.

## Cookies and local storage

| Name | Purpose | Duration |
|---|---|---|
| `qh_aid` | Pseudonymous analytics identifier | 1 year |
| `qh_sid` | Groups page views into a visit | 30 minutes of inactivity |
| `qh_consent` | Remembers your analytics choice | 1 year |
| `qh_user` | Shows your name in the header when signed in | While signed in |
| `sb-…` | Keeps you signed in (Supabase Auth) | While signed in |
| `theme` (local storage) | Remembers light or dark mode | Until cleared |

## Why we use it

- To run the site and keep it secure (essential analytics, sign-in).
- To decide which notes and walkthroughs to write or improve.
- With your consent, to power your personal history and progress.

## How long we keep it

- Raw analytics events: **13 months**, then deleted automatically. We keep only daily totals (for example "page viewed 240 times") after that, which cannot identify anyone.
- Your account data: until you delete your account.
- Feedback: up to 13 months after we have reviewed it.

## Who processes it for us

We use trusted providers to run the site: **Supabase** (database and sign-in), **Vercel** (hosting), **Cloudinary** (images and files) and **Google** (sign-in). They process data only on our instructions. We do not sell or rent personal data, and we do not use advertising trackers.

## Your rights

You can:

- **Access** your data — use *Download my data* in your dashboard;
- **Correct** your profile details in your dashboard;
- **Delete** your account and associated data — use *Delete my account* in your dashboard;
- **Withdraw consent** for detailed analytics at any time from the cookie settings link in the footer;
- **Raise a grievance** with us at <ContactEmail />, and if unresolved, with the Data Protection Board of India.

## Children

Many qualifier applicants are still in school. If you are under 18, please use the site without signing in, or only with the consent of a parent or guardian. We do not enable detailed analytics for anyone who has not confirmed they are 18 or older.

## Related

- [Terms of use](/terms)
- [About this site](/about)
- [Contact us](/contact)

## Changes

If we change this policy we will update the date at the top of this page.
$md$,
 '[]', 'legal', null, '2026-09-23', 20, true, null,
 'What we collect, why, and for how long — pseudonymous essential analytics, opt-in detailed analytics, no stored IPs, and how to download or delete your data.'),

('terms', 'Terms of Use',
 'The rules for using this site, including academic integrity and our disclaimers.',
 $md$*Last updated: 23 September 2026*

By using <SiteName /> you agree to these terms.

## Independence

We are an independent study resource. We are not affiliated with, endorsed by or acting for IIT Madras. Course names and codes are used only to describe what our material helps you study.

## Academic integrity

The IIT Madras BS programme has its own rules about how graded assignments must be attempted. You are responsible for following them. Our hints and concept explanations are designed to help you learn, and full walkthroughs are published only after the official deadline. Do not use this site, or anything copied from it, to break those rules.

## Our content

The notes, hints, walkthroughs and other material we write are protected by copyright. You may read, print and share links to them for your personal study. Please don't republish, sell or copy them to other websites or apps without our written permission.

## Accounts

You sign in with Google and are responsible for activity on your account. We may suspend accounts that abuse the site, for example by scraping it or attacking its services.

## Accuracy

We work hard to keep everything correct and up to date, but official rules, dates and fees can change. Always confirm important details on the official IIT Madras pages. The site is provided "as is", without warranties of any kind.

## Liability

To the fullest extent the law allows, we are not liable for any loss arising from your use of the site, including decisions made on the basis of its content.

## Law

These terms are governed by the laws of India.

## Privacy

How we collect and use data is described in our [privacy policy](/privacy).

## Contact

Questions about these terms: <ContactEmail />.
$md$,
 '[]', 'legal', null, '2026-09-23', 21, true, null,
 'Terms of use for this independent IIT Madras BS qualifier study resource — academic integrity, our content, accounts and disclaimers.'),

('contact', 'Contact',
 'How to reach us — corrections, content requests, permissions and privacy questions.',
 $md$We read every message. The fastest way to reach us is email: <ContactEmail />.

## What to include

- **Found a mistake?** Send the page link and what should change. You can also use the "Was this helpful?" box at the bottom of any page.
- **Want a topic covered?** Tell us the course and week.
- **Copyright or permission concerns:** include a link to the page and to your original work. We review these quickly and remove material that was used without permission.
- **Privacy requests:** you can download or delete your data yourself from your [dashboard settings](/dashboard/settings); see the [privacy policy](/privacy) for what we store. For anything else, email us with the subject "Privacy".
$md$,
 '[]', 'legal', null, '2026-09-23', 22, true, null,
 'Contact the team — report a mistake, request a topic, or raise a copyright or privacy question.')
on conflict (path) where deleted_at is null do nothing;

-- ── Interactive and data-driven guide pages ─────────────────────────────────
insert into public.pages (path, title, summary, body_mdx, sources, template, author_id, last_reviewed_at, sort_order, is_published, seo_title, seo_description)
values
('qualifier/syllabus', 'Qualifier Syllabus: Week-by-Week Topics',
 'Every topic in weeks 1–4 of each qualifier course, from the official course pages, with links to notes and graded assignment help.',
 $md$The qualifier exam covers **weeks 1–4** of each course in your programme. The topics below come from the official IIT Madras course pages; each week links to its notes, graded assignment help and practice on this site.

Every programme has four qualifier courses, and each course teaches one block of topics per week. The weekly graded assignment tests that week's topics, and the exam draws on all four weeks of all four courses — so a week you rush is a week you will need to revisit before the exam.

## Data Science and Applications

<SyllabusOverview program="data-science" />

## Electronic Systems

<SyllabusOverview program="electronic-systems" />

<Callout type="info">
Management and Data Science uses the Data Science courses, and Aeronautics and Space Technology uses the Electronic Systems courses.
</Callout>

## Related

- <RelatedLink href="/qualifier/exam-pattern" />
- <RelatedLink href="/qualifier/eligibility" />
- <RelatedLink href="/qualifier/timeline" />
$md$,
 '[{"title":"Data Science course pages — IIT Madras","url":"https://study.iitm.ac.in/ds/academics.html"},{"title":"Electronic Systems course pages — IIT Madras","url":"https://study.iitm.ac.in/es/academics.html"}]',
 'guide', (select id from public.authors where slug = 'editorial-team'), '2026-09-23', 5, true,
 'IITM BS Qualifier Syllabus 2026 – Week-wise Topics',
 'The IIT Madras BS qualifier syllabus week by week: Maths 1, Stats 1, CT, English 1 and all four Electronic Systems courses, with notes for each week.'),

('qualifier/ga-calculator', 'Graded Assignment Eligibility Calculator',
 'Enter your weekly graded assignment scores to see whether you clear the hall-ticket cut-off in every course.',
 $md$Type your **week 1, 2 and 3 graded assignment scores** for each course. The calculator averages your best two of the first three weeks — the rule on the official admissions page — and checks it against the cut-off for your category.

<EligibilityCalculator />

## How the rule works

Only your best two of the first three weekly scores count in each course. If you scored 70, 0 and 55, your best two are 70 and 55, so your average is 62.5%. A week you skip counts as zero, so one missed week leaves no room for a bad week.

You must clear the cut-off in **every** course — a strong average in three courses does not make up for one below the line.

## A worked example

A General-category Data Science student (cut-off 40% in each course) scores:

| Course | Week 1 | Week 2 | Week 3 | Best two | Average | Clears 40%? |
|---|---|---|---|---|---|---|
| Maths 1 | 80 | 45 | 60 | 80 and 60 | 70% | Yes |
| Stats 1 | 30 | 50 | 0 | 50 and 30 | 40% | Yes, just |
| CT | 100 | 0 | 0 | 100 and 0 | 50% | Yes |
| English 1 | 35 | 40 | 30 | 40 and 35 | 37.5% | No |

Three strong courses are not enough: English 1 misses the line by 2.5 percentage points, so this student would not get a hall ticket. Planning backwards from the rule helps:

- **Weeks 1 and 2 are your real attempts.** Week 3 is the safety net that replaces one bad week — not a second chance at two.
- **A zero in week 1 makes weeks 2 and 3 count in full.** Both then need to average at least the cut-off.
- **Check the weakest course first.** The rule is decided by your lowest course, not your best one.

<Callout type="info">
Your official status is whatever the IIT Madras portal shows. This calculator is a planning aid built from the published rule; the Student Handbook also describes a two-stage version for the first exam of the term, explained on the eligibility page.
</Callout>

## Related

- <RelatedLink href="/qualifier/eligibility" />
- <RelatedLink href="/qualifier/score-calculator" />
- <RelatedLink href="/qualifier/timeline" />
$md$,
 '[{"title":"Data Science admissions — IIT Madras","url":"https://study.iitm.ac.in/ds/admissions.html"},{"title":"Electronic Systems admissions — IIT Madras","url":"https://study.iitm.ac.in/es/admissions.html"}]',
 'guide', (select id from public.authors where slug = 'editorial-team'), '2026-09-23', 6, true,
 'IITM Qualifier GA Calculator – Best 2 of 3 Eligibility Check',
 'Check if your IIT Madras BS graded assignment scores earn a qualifier hall ticket: best 2 of the first 3 weeks, by category, for every course.'),

('qualifier/score-calculator', 'Qualifier Exam Score Calculator',
 'Check whether your qualifier exam marks clear the per-course and average cut-offs, and how many courses you can take in your first term.',
 $md$Enter your **qualifier exam percentage in each course**. The calculator checks the two conditions you must meet — a minimum in every course and a minimum average — and shows how many courses your average lets you register for in your first term.

<ScoreCalculator />

## Two conditions, both required

Clearing the average is not enough on its own, and neither is clearing every course. A General-category candidate with 90, 85, 80 and 38 averages 73.25% but still does not qualify, because one course is below 40%.

## How the average is worked out

Your qualifier average is the simple mean of your four course percentages — every course carries the same weight. With 72, 58, 64 and 81:

$$
\frac{72 + 58 + 64 + 81}{4} = \frac{275}{4} = 68.75\%
$$

For a General-category candidate that clears both conditions: every course is above 40% and the average is above 50%.

## What your average unlocks

Clearing the qualifier admits you to the Foundation level, and your average sets how many courses you may take in your first term — the calculator shows the number for your score, and the full table is on the exam pattern page. A higher average gives you more room to plan your first term, so it is worth aiming beyond the bare cut-off.

## If you fall short

If you had a hall ticket but did not clear the exam, you can **re-attempt in the same term** without redoing the graded assignments. Use your course-by-course result to decide where to spend your revision time — the course below its minimum matters more than raising a strong one.

## Does the qualifier score count later?

It can. If you register for courses in the same term as your qualifier, your qualifier exam score in a course counts as that course's first quiz (Quiz 1).

## Related

- <RelatedLink href="/qualifier/exam-pattern" />
- <RelatedLink href="/qualifier/ga-calculator" />
- <RelatedLink href="/qualifier/syllabus" />
$md$,
 '[{"title":"Data Science admissions — IIT Madras","url":"https://study.iitm.ac.in/ds/admissions.html"}]',
 'guide', (select id from public.authors where slug = 'editorial-team'), '2026-09-23', 7, true,
 'IITM Qualifier Score Calculator – Pass Check & Course Limit',
 'Enter your IIT Madras BS qualifier marks to check the per-course and average cut-offs for your category and how many courses you can take in term one.')
on conflict (path) where deleted_at is null do nothing;

-- ── FAQs ─────────────────────────────────────────────────────────────────────
insert into public.faqs (scope, scope_id, question, answer_mdx, sort_order, is_published)
select 'global', null, f.q, f.a, f.o, true
from (values
  ('Is this site run by IIT Madras?',
   'No. It is an independent study resource, not affiliated with or endorsed by IIT Madras. For official rules and dates, always check the IIT Madras BS admissions pages.', 1),
  ('Can I apply for the qualifier while I am still in school?',
   'Yes. Students who have finished their Class 11 exams can apply. If they clear the qualifier, they join the programme after passing Class 12.', 2),
  ('How do graded assignments decide who writes the qualifier exam?',
   'In each of the four courses, the average of your best two of the first three weekly graded assignment scores must reach the minimum for your category — 40% for General, 35% for OBC-NCL/EWS and 30% for SC/ST/PwD — in every course.', 3),
  ('What are the qualifier exam cut-offs?',
   'General candidates need at least 40% in each course and a 50% average. OBC-NCL/EWS need 35% in each and a 45% average; SC/ST/PwD need 30% in each and a 40% average.', 4),
  ('How long is the qualifier exam?',
   'It is a single four-hour, in-person exam covering all four qualifier courses of your programme.', 5),
  ('What happens if I fail the qualifier exam?',
   'If you had a hall ticket, you can re-attempt in the same term without redoing the weekly assignments, for a re-attempt fee (₹2,000 for General/OBC). If you did not get a hall ticket, you can apply again in a later term.', 6),
  ('When do graded assignment walkthroughs appear here?',
   'Only after the official deadline has passed. Before that, each page shows the concepts being tested, a hint for every question and practice questions.', 7),
  ('How much does it cost to apply?',
   'The application fee is ₹4,000 for General/OBC candidates, ₹2,000 for SC/ST/PwD candidates and ₹1,000 for SC/ST candidates who are also PwD. It is non-refundable.', 8),
  ('Can I join without writing the qualifier?',
   'Candidates who were eligible to write the most recent JEE Advanced can join the Foundation level directly by paying the admission fee.', 9),
  ('Does my qualifier exam score count after I join?',
   'If you register for courses in the same term as your qualifier, your qualifier exam score is counted as Quiz 1 for those courses.', 10)
) as f (q, a, o)
where not exists (select 1 from public.faqs x where x.scope = 'global' and x.question = f.q and x.deleted_at is null);

insert into public.faqs (scope, scope_id, question, answer_mdx, sort_order, is_published)
select 'program', p.id, f.q, f.a, f.o, true
from (values
  ('data-science', 'Do I need to know programming for the Data Science qualifier?',
   'No. Computational Thinking teaches problem solving with flowcharts and pseudocode; you do not need a programming language during the qualifier weeks.', 1),
  ('data-science', 'What background do I need for the Data Science qualifier?',
   'You should have studied Mathematics and English in Class 10 and passed Class 12 (or be finishing it). Any stream is fine.', 2),
  ('data-science', 'Which courses are in the Data Science qualifier?',
   'Mathematics for Data Science I, Statistics for Data Science I, Computational Thinking and English I — weeks 1 to 4 of each.', 3),
  ('electronic-systems', 'Which subjects do I need to apply for Electronic Systems?',
   'You need Class 12 (or an equivalent) with Physics and Mathematics.', 1),
  ('electronic-systems', 'Is there programming in the Electronic Systems qualifier?',
   'Yes. Introduction to C Programming is one of the four qualifier courses; weeks 3 and 4 introduce writing C programs.', 2),
  ('electronic-systems', 'Are there labs during the qualifier?',
   'No. Lab courses come after you join the programme, and some require visits to the IIT Madras campus. The qualifier itself is coursework plus one exam.', 3)
) as f (program_slug, q, a, o)
join public.programs p on p.slug = f.program_slug
where not exists (select 1 from public.faqs x where x.scope = 'program' and x.scope_id = p.id and x.question = f.q and x.deleted_at is null);

-- ── Official links (resources) ───────────────────────────────────────────────
insert into public.resources (kind, title, description, url, source_url, source_permission, sort_order, is_published)
select 'link', r.title, r.description, r.url, r.url, 'official_link', r.o, true
from (values
  ('IIT Madras BS Data Science — admissions', 'Official eligibility, fees, cut-offs and important dates for the Data Science programme.', 'https://study.iitm.ac.in/ds/admissions.html', 1),
  ('IIT Madras BS Electronic Systems — admissions', 'Official eligibility, fees, cut-offs and important dates for the Electronic Systems programme.', 'https://study.iitm.ac.in/es/admissions.html', 2),
  ('IIT Madras BS academic calendar', 'Term start dates, quiz dates and exam dates published by the programme office.', 'https://study.iitm.ac.in/ds/academic_calendar.html', 3),
  ('IIT Madras BS Data Science — FAQ', 'The programme office''s answers to common questions about applying and the qualifier.', 'https://study.iitm.ac.in/ds/faq.html', 4)
) as r (title, description, url, o)
where not exists (select 1 from public.resources x where x.url = r.url and x.deleted_at is null);

-- ── Navigation ───────────────────────────────────────────────────────────────
insert into public.nav_items (location, label, href, description, sort_order)
select v.location, v.label, v.href, v.description, v.o
from (values
  ('header', 'Data Science', '/data-science', 'Maths 1, Stats 1, CT and English 1', 1),
  ('header', 'Electronic Systems', '/electronic-systems', 'English 1, MfE 1, ESTC and C Programming', 2),
  ('header', 'Qualifier guide', '/qualifier', 'Eligibility, exam pattern and dates', 3),
  ('header', 'Resources', '/resources', 'Official links and downloads', 4),
  ('quick', 'Maths 1', '/data-science/maths-1', 'Mathematics for Data Science I', 1),
  ('quick', 'Stats 1', '/data-science/stats-1', 'Statistics for Data Science I', 2),
  ('quick', 'Computational Thinking', '/data-science/computational-thinking', 'Iteration, filtering and procedures', 3),
  ('quick', 'English 1', '/data-science/english-1', 'Data Science English I', 4),
  ('quick', 'Eligibility', '/qualifier/eligibility', 'Who gets a hall ticket', 5),
  ('quick', 'Exam pattern', '/qualifier/exam-pattern', 'Format and cut-offs', 6)
) as v (location, label, href, description, o)
where not exists (select 1 from public.nav_items n where n.location = v.location and n.href = v.href);

insert into public.footer_links (group_label, group_order, label, href, sort_order)
select v.g, v.go, v.label, v.href, v.o
from (values
  ('Programmes', 1, 'Data Science', '/data-science', 1),
  ('Programmes', 1, 'Electronic Systems', '/electronic-systems', 2),
  ('Qualifier', 2, 'How it works', '/qualifier', 1),
  ('Qualifier', 2, 'Eligibility', '/qualifier/eligibility', 2),
  ('Qualifier', 2, 'Exam pattern', '/qualifier/exam-pattern', 3),
  ('Qualifier', 2, 'Timeline', '/qualifier/timeline', 4),
  ('Site', 3, 'About', '/about', 1),
  ('Site', 3, 'Resources', '/resources', 2),
  ('Site', 3, 'Contact', '/contact', 3),
  ('Legal', 4, 'Privacy', '/privacy', 1),
  ('Legal', 4, 'Terms', '/terms', 2)
) as v (g, go, label, href, o)
where not exists (select 1 from public.footer_links f where f.group_label = v.g and f.href = v.href);

-- ── Analytics event catalogue ────────────────────────────────────────────────
insert into public.event_definitions (name, category, description, properties, store_raw)
values
  ('session_start', 'session', 'First event of a visit (new session identifier).', '{"landing_path":"string"}', true),
  ('session_end', 'session', 'Tab hidden or closed; closes the session and records its duration.', '{}', false),
  ('tab_visibility_change', 'session', 'The tab became visible or hidden.', '{"state":"visible | hidden"}', true),
  ('page_view', 'navigation', 'A page was viewed (also creates a page_views row).', '{"is_entry":"boolean","referrer_host":"string","search_engine":"string","search_query":"string when the referrer exposes it"}', true),
  ('internal_link_click', 'navigation', 'Click on a link to another page of this site.', '{"href":"string","label":"string","area":"content | nav | footer | card"}', true),
  ('outbound_link_click', 'navigation', 'Click on a link to another website.', '{"href":"string","host":"string"}', true),
  ('breadcrumb_click', 'navigation', 'Click on a breadcrumb.', '{"href":"string","position":"number"}', true),
  ('nav_click', 'navigation', 'Click in the header, programme switcher or mobile menu.', '{"href":"string","label":"string"}', true),
  ('scroll_depth', 'content', 'Deepest scroll milestone reached (25/50/75/100). Folded into page_views.max_scroll.', '{"depth":"25 | 50 | 75 | 100"}', false),
  ('time_on_page', 'content', 'Heartbeat every 15s while the tab is visible. Folded into page_views.engaged_seconds.', '{"seconds":"number"}', false),
  ('toc_click', 'content', 'Click in a table of contents.', '{"heading":"string","level":"2 | 3"}', true),
  ('hint_reveal', 'content', 'A question hint was revealed.', '{"question_id":"uuid","position":"number"}', true),
  ('solution_view', 'content', 'A released walkthrough was opened.', '{"question_id":"uuid","position":"number"}', true),
  ('solution_gate_seen', 'content', 'The "walkthrough unlocks after the deadline" gate was shown.', '{"assignment_id":"uuid","seconds_until_release":"number"}', true),
  ('copy_text', 'content', 'Text was copied from the page.', '{"length":"number"}', true),
  ('code_copy', 'content', 'A code block copy button was used.', '{"language":"string","length":"number"}', true),
  ('formula_sheet_open', 'content', 'A formula sheet was opened.', '{"course":"string"}', true),
  ('print_click', 'content', 'The print button on a formula sheet or note was used.', '{"page_type":"string"}', true),
  ('download_click', 'downloads', 'A download or resource link was clicked (client side).', '{"resource_id":"uuid","kind":"string"}', true),
  ('download_complete', 'downloads', 'Server-confirmed download issued by /api/download (stored in downloads).', '{"resource_id":"uuid","file_type":"string","file_bytes":"number"}', false),
  ('search_query', 'search', 'A search was run (logged server-side in searches).', '{"query":"string","results_count":"number"}', false),
  ('search_result_click', 'search', 'A search result was opened.', '{"search_id":"uuid","position":"number","target":"string"}', true),
  ('search_zero_results', 'search', 'A search returned nothing (logged server-side in searches).', '{"query":"string"}', false),
  ('login_click', 'auth', 'The sign-in button was clicked.', '{"provider":"google","source":"string"}', false),
  ('login_success', 'auth', 'Sign-in completed.', '{"provider":"google"}', false),
  ('login_failure', 'auth', 'Sign-in failed.', '{"provider":"google","reason":"string"}', false),
  ('logout', 'auth', 'The user signed out.', '{}', false),
  ('signup_first_login', 'auth', 'First ever sign-in for this account.', '{"provider":"google"}', false),
  ('onboarding_complete', 'auth', 'Programme and term chosen after first sign-in.', '{"program":"string","term":"string"}', false),
  ('bookmark_add', 'engagement', 'A page was bookmarked.', '{"path":"string"}', true),
  ('bookmark_remove', 'engagement', 'A bookmark was removed.', '{"path":"string"}', true),
  ('progress_toggle', 'engagement', 'A progress checkbox was ticked or cleared.', '{"item_type":"string","item_id":"uuid","done":"boolean"}', true),
  ('feedback_helpful', 'engagement', 'Answered "Was this helpful?".', '{"helpful":"boolean","has_comment":"boolean"}', true),
  ('share_click', 'engagement', 'A share button was used.', '{"channel":"whatsapp | telegram | x | copy | native"}', true),
  ('theme_toggle', 'engagement', 'Light/dark mode was changed.', '{"theme":"light | dark | system"}', true),
  ('consent_update', 'engagement', 'The analytics consent choice changed.', '{"level":"essential | detailed"}', true),
  ('js_error', 'errors', 'An uncaught JavaScript error or unhandled rejection.', '{"message":"string","source":"string","line":"number"}', true),
  ('api_error', 'errors', 'A client request to our API failed.', '{"endpoint":"string","status":"number"}', true),
  ('404_hit', 'errors', 'A page was not found.', '{"path":"string","referrer":"string"}', true),
  ('web_vital', 'performance', 'Core Web Vitals sample (LCP, CLS, INP, TTFB, FCP). Folded into page_views.', '{"metric":"LCP | CLS | INP | TTFB | FCP","value":"number","rating":"good | needs-improvement | poor"}', false)
on conflict (name) do nothing;
