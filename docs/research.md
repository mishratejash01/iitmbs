# Research: the IIT Madras BS qualifier and what students search for

_Compiled 2026-09-23. Official facts were read on study.iitm.ac.in and the
official IIT Madras BS documents linked from it. Keyword data comes from Google
and YouTube autocomplete (gl=IN), 935 archived Reddit posts from the two main
student subreddits, Quora question titles and competitor page structure (titles
and structure only — no content was copied)._

Status labels used below: **VERIFIED** (read on an official page or document on
2026-09-23), **UNOFFICIAL** (third-party source), **UNVERIFIED** (could not be
confirmed — flagged for the admin).

---

## 1. Programmes that use the qualifier

| Programme (official name)                  | Slug                           | Qualifier courses                                               | Source                                                 |
| ------------------------------------------ | ------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------ |
| BS Degree in Data Science and Applications | `data-science`                 | BSMA1001, BSMA1002, BSCS1001, BSHS1001                          | https://study.iitm.ac.in/ds/admissions.html (VERIFIED) |
| BS in Electronic Systems                   | `electronic-systems`           | HS1101, MA1101, EE1101, CS1101                                  | https://study.iitm.ac.in/es/admissions.html (VERIFIED) |
| BS in Management and Data Science          | `management-data-science`      | the four DS courses                                             | https://study.iitm.ac.in/mg/admissions.html (VERIFIED) |
| BS in Aeronautics and Space Technology     | `aeronautics-space-technology` | the four ES courses (as BSHS1101, BSMA1101, BSEE1101, BSCS1101) | https://study.iitm.ac.in/ae/admissions.html (VERIFIED) |

MG and AE reuse the DS and ES courses, so they are modelled as **cross-listings**
(`course_programs`): each course keeps one canonical URL and the MG/AE paths
301-redirect to it. Both are seeded unpublished — the brief scopes the launch to
DS and ES.

## 2. Verified course list

| Programme | Course                                   | Code     | Credits | Slug                     | Aliases (searched)                                                     | Weeks | Official page                                          |
| --------- | ---------------------------------------- | -------- | ------- | ------------------------ | ---------------------------------------------------------------------- | ----- | ------------------------------------------------------ |
| DS        | Mathematics for Data Science I           | BSMA1001 | 4       | `maths-1`                | maths 1, math 1, mathematics 1, maths1, mathematics for data science 1 | 1–4   | https://study.iitm.ac.in/ds/course_pages/BSMA1001.html |
| DS        | Statistics for Data Science I            | BSMA1002 | 4       | `stats-1`                | stats 1, statistics 1, stats1, stat 1                                  | 1–4   | https://study.iitm.ac.in/ds/course_pages/BSMA1002.html |
| DS        | Computational Thinking                   | BSCS1001 | 4       | `computational-thinking` | ct, computational thinking, ct 1                                       | 1–4   | https://study.iitm.ac.in/ds/course_pages/BSCS1001.html |
| DS        | English I                                | BSHS1001 | 4       | `english-1`              | english 1, english i, eng 1                                            | 1–4   | https://study.iitm.ac.in/ds/course_pages/BSHS1001.html |
| ES        | English I                                | HS1101   | 4       | `english-1`              | english 1, es english                                                  | 1–4   | https://study.iitm.ac.in/es/course_pages/HS1101.html   |
| ES        | Math for Electronics I                   | MA1101   | 4       | `math-for-electronics-1` | math for electronics 1, mfe 1                                          | 1–4   | https://study.iitm.ac.in/es/course_pages/MA1101.html   |
| ES        | Electronic Systems Thinking and Circuits | EE1101   | 4       | `estc`                   | estc, electronic systems thinking and circuits                         | 1–4   | https://study.iitm.ac.in/es/course_pages/EE1101.html   |
| ES        | Introduction to C Programming            | CS1101   | 4       | `c-programming`          | c programming, introduction to c programming                           | 1–4   | https://study.iitm.ac.in/es/course_pages/CS1101.html   |

DS English I (BSHS1001) and ES English I (HS1101) are **different courses** with
different codes and week wording, so each has its own page.

The qualifier covers **weeks 1–4** of each 12-week course (VERIFIED — admissions
pages and DS FAQ: "classes start (with week 5) immediately after … week 4").

### Week topics (official course pages, VERIFIED)

The seed (`supabase/seed.sql`) stores every week's title and topic list exactly
as summarised below.

| Course                 | Week 1                                                   | Week 2                                                                               | Week 3                                                                  | Week 4                                                                                |
| ---------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Maths 1                | Set theory: number systems, sets, relations, functions   | Straight lines: coordinates, slope, parallel/perpendicular, forms, straight-line fit | Quadratic functions: vertex, extrema, equations                         | Algebra of polynomials: operations, division, intercepts, multiplicity, end behaviour |
| Stats 1                | Types of data, descriptive vs inferential, scales        | Describing categorical data                                                          | Describing numerical data: centre, spread, five-number summary          | Association: contingency tables, scatterplots, covariance, correlation                |
| CT                     | Variables, iterators, filtering, flowcharts, data sanity | Iteration, selection, pseudocode, max/min, AND                                       | Multiple iterations, three-prizes problem, procedures, side effects, OR | Nested iterations, birthday paradox, binning                                          |
| English I (DS)         | Sounds and words                                         | Parts of speech                                                                      | Sentences: phrases and idioms                                           | Speaking skills                                                                       |
| English I (ES)         | Sounds and words                                         | Parts of speech and articles                                                         | Words and phrases: phrasal/modal verbs, idioms                          | Speaking skills and telephone English                                                 |
| Math for Electronics I | Functions, equations, straight lines                     | Systems of linear equations, matrices                                                | Sequences and limits                                                    | Limits of functions and continuity                                                    |
| ESTC                   | Mobile teardown and the resistor                         | Voltage, current, Ohm's law, KCL/KVL, nodal/mesh                                     | Dial, talk and hear: microphone, motor, sinusoid, harmonics             | Problem solving with resistive circuits                                               |
| C Programming          | How a computer works                                     | Data representation, compilation                                                     | Introduction to C: structure, variables, operators                      | Control statements                                                                    |

**Conflict (UNVERIFIED which the portal uses):** the DS syllabus PDF (Sep 2025)
words DS English I weeks 2–4 like the ES course page, and the ES syllabus
document lists different topics for MA1101 and CS1101 than the course pages.
The seed follows the course pages, which appear newer.

## 3. Qualifier rules (VERIFIED unless marked)

| Topic                         | Rule                                                                                                                                                       | Source                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Who can apply — DS            | Class 12 passed (any stream, any age), Maths and English studied in Class 10; Class 11 finishers may apply and join after Class 12                         | DS admissions, DS Student Handbook §5.1.1   |
| Who can apply — ES            | Class 12 with Physics and Mathematics; Class 11 finishers may apply                                                                                        | ES admissions                               |
| Application fee               | ₹4,000 General/OBC · ₹2,000 SC/ST/PwD · ₹1,000 SC/ST + PwD; non-refundable; extra fee for centres abroad                                                   | DS/ES admissions                            |
| Fee history                   | DS was ₹3,000 until the Jan 2026 term; ES was ₹6,000 until late 2025 (Wayback)                                                                             | Handbook, Wayback                           |
| Hall-ticket rule              | In each course: average of best 2 of the first 3 weekly GA scores ≥ 40% General / 35% OBC-NCL/EWS / 30% SC/ST/PwD                                          | DS/ES admissions                            |
| Two-stage variant             | Handbook: if avg(W1, W2) clears the cut-off in all four → first exam; else best 2 of 3 → second exam in the same term                                      | DS Handbook §5.1.3 (not on admissions page) |
| Historical rule               | Best 3 of 4 weekly scores until mid-2022                                                                                                                   | Wayback 2022                                |
| Exam                          | One in-person, invigilated, 4-hour exam covering all four courses; centres in India plus UAE, Sri Lanka, Bahrain, Kuwait, Oman; remote-proctored elsewhere | DS/ES admissions                            |
| Pass marks                    | General 40% each / 50% average · OBC-NCL/EWS 35 / 45 · SC/ST/PwD 30 / 40 (identical for DS and ES since 2022)                                              | DS/ES admissions, Handbook §5.1.4           |
| Re-attempt                    | Same term, no redoing assignments; ₹2,000 / ₹1,000 / ₹500                                                                                                  | DS/ES admissions                            |
| Course load after qualifying  | Average M: cut-off–50% → up to 2 courses; 50–70% → 3; ≥70% → 4 (Handbook calls it a suggestion, default 4 same-term)                                       | DS admissions; Handbook §6                  |
| Quiz 1 credit                 | Same-term registrants' qualifier score counts as Quiz 1                                                                                                    | Handbook §5.1.9, academics page             |
| Validity                      | DS page: 3 terms (6 for school students); Handbook: 3 terms; ES page: 2 semesters — **conflicting (UNVERIFIED)**                                           | DS/ES admissions, Handbooks                 |
| JEE route                     | Eligible for the latest JEE Advanced → direct Foundation entry, ₹4,000 admission fee, valid 3 terms                                                        | DS admissions, Handbook §5.2                |
| Question types                | **Not published (UNVERIFIED)**. GAs use MCQ/MSQ/numeric.                                                                                                   | —                                           |
| Negative marking / calculator | **Not published (UNVERIFIED)** — frequent student questions                                                                                                | Reddit                                      |

### September 2026 dates (official Important Dates sheet, VERIFIED)

| Event                       | Date                                                   |
| --------------------------- | ------------------------------------------------------ |
| Applications open           | 13 Jul 2026 (calendar image says 29 Jun — conflict)    |
| Applications close          | Sun 27 Sep 2026                                        |
| Week 1 starts               | Fri 2 Oct 2026                                         |
| Qualifier exam 1-1          | Sun 15 Nov 2026                                        |
| Results, registration opens | Thu 19 Nov 2026                                        |
| Exam 2-1 and re-attempt 1-2 | Sat 5 Dec 2026                                         |
| Results                     | Wed 9 Dec 2026 (calendar image says 15 Dec — conflict) |
| Re-attempt 2-2              | Sun 10 Jan 2027                                        |
| Final results               | Thu 14 Jan 2027                                        |

Weekly GA deadlines for Sep 2026 are **not public** before the term — the
seeded draft assignments deliberately have no due date and a far-future release
(fail-closed) until an editor sets them.

## 4. What students search for

### Headline findings

1. **Head demand is exam-level**: "iitm bs qualifier exam", "…syllabus", "…pyq",
   "…exam date", "…result" dominate autocomplete.
2. **GA queries are "(iitm | iit madras) {course} week {n} graded assignment
   (answers | solutions)"** — maths first, then CT, then English and statistics.
   The year ("2026") appears as a modifier; months never do.
3. **"Qualifier" is almost never combined with a week or GA on Google** (it is on
   YouTube: "qualifier one shot", "revision").
4. **"GA" alone collides** with "GATE"; bare short forms collide with unrelated
   searches (Philippine "math 1 week 2 quarter 4", NFL "stats week 2",
   Connecticut "ct week 2"). Titles and H1s must carry "IITM" / "IIT Madras".
5. **Aliases in use**: maths 1, math 1, mathematics 1, maths1; stats 1,
   statistics 1; ct, computational thinking; english 1. "m1"/"s1" return nothing
   — keep them as on-page synonyms only.
6. **Notes demand is course-level** ("iitm maths 1 notes"), not week-level.
7. **Formula sheets have weak explicit demand** — build them as printable
   link-magnets and exam-prep assets.
8. **Tools are uncontested**: "iitm score checker", "iitm score calculator",
   "iitm qualifier answer key", "iitm grade calculator".
9. **Electronic Systems has guide-level demand only** and essentially no week
   level competition.
10. **Hindi/Tamil/Telugu** qualifier queries return nothing.

### Keyword clusters → target pages

| Cluster           | Head term                                    | Main variants                                                          | Intent                       | Target                                                                     |
| ----------------- | -------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| Programme hub     | iitm bs data science                         | iit madras bs data science, iitm bs ds, + notes/pyq/syllabus           | Informational                | `/data-science`                                                            |
| Programme hub     | iitm bs electronic systems                   | iitm bs es, iitm bs electronics, + syllabus/notes                      | Informational                | `/electronic-systems`                                                      |
| Qualifier hub     | iitm bs qualifier                            | iit madras qualifier, what is iitm qualifier exam                      | Informational                | `/qualifier`                                                               |
| Eligibility       | iitm bs qualifier eligibility                | eligibility criteria, class 11/12, NIOS, no maths                      | Informational                | `/qualifier/eligibility`                                                   |
| Exam pattern      | iitm bs qualifier exam pattern               | total marks, timing, negative marking, online or offline, difficulty   | Informational                | `/qualifier/exam-pattern`                                                  |
| Cut-offs          | iitm bs qualifier passing criteria           | passing marks, cutoff                                                  | Informational                | `/qualifier/exam-pattern`                                                  |
| Dates             | iitm bs qualifier exam date                  | exam date 2026, last date to apply 2026, september term, calendar 2026 | Informational / navigational | `/qualifier/timeline`                                                      |
| GA rules          | iitm graded assignment                       | best 2 of 3, minimum GA score, missed week 1                           | Informational                | `/qualifier/eligibility`                                                   |
| GA per week       | iitm {course} week {n} graded assignment     | …answers week {n} {subject}, …solutions, …2026                         | Answer-seeking               | `/{programme}/{course}/week-{n}/graded-assignment`                         |
| Cross-course week | iitm week {n} graded assignment answers      | iit madras week {n} graded assignment                                  | Answer-seeking               | `/{programme}/week-{n}`                                                    |
| Course notes      | iitm {course} notes                          | {course} iitm bs notes, …pdf                                           | Informational                | `/{programme}/{course}` + week notes                                       |
| Exam prep         | how to prepare for iit madras qualifier exam | qualifier one shot, revision, pyq, mock test                           | Informational                | `/{programme}/{course}/qualifier-exam-prep`                                |
| Formula sheets    | iitm stats 1 formula sheet                   | maths 1 formula sheet                                                  | Informational / download     | `/{programme}/{course}/formula-sheet`                                      |
| Tools             | iitm score checker                           | score calculator, answer key                                           | Tool                         | GA-eligibility and score calculators (CMS pages with embedded calculators) |

**Title pattern for GA pages** (stored in `site_settings.seo.templates`, editable):
`IITM {short} Week {n} Graded Assignment {year} – Hints & Solutions`.
The term is shown as a visible label in the H1 area; URLs stay evergreen.

## 5. Student question bank (for FAQ content)

Grouped, neutrally worded questions gathered from autocomplete, Reddit and
Quora. They are prompts for **original** answers — the seeded FAQs answer the
verified ones; the rest are a writing backlog.

**Eligibility and application** — Can I apply in Class 12 or right after Class
11? · Do I need Maths/PCM in Class 12 for Data Science? · Is Physics + Maths
needed for Electronic Systems? · Is there an age limit? · Can I apply with NIOS
or pending results? · Can applicants with foreign schooling apply? · Which
documents are needed and what if my EWS/OBC certificate is late? · My documents
are under verification — can I start Week 1? · What is the last date for the Sep
2026 term? · How much is the fee and is it refundable? · Can I edit a submitted
application? · I qualified JEE — do I still take the qualifier? · How do Data
Science and Management & Data Science differ? · Data Science or Electronic
Systems? · Do I need a laptop during the qualifier?

**How the qualifier works** — Is it an entrance exam or a four-week course? ·
When does Week 1 open and when is the exam? · Is there a fixed timetable? · How
is content released each week? · Is the qualifier exam the same as Quiz 1? · How
do the qualifier, quizzes and end-term differ? · Which term do I join after
passing, and do I redo weeks 1–4? · How many attempts do I get? · Can I defer
joining?

**Graded assignments** — How is "best 2 of the first 3" calculated? · Does the
Week-4 GA count? · I missed Week 1 — can I still qualify? · What minimum average
does each category need? · When is each GA due? · My GA shows "not submitted" —
what now? · When do GA marks appear? · Are practice assignments graded? · Do
portal mock tests count? · Where are the CT datasets? · Do GA questions differ
between students and terms? · Is using AI or answer sites allowed? · Can a
deadline be extended after portal downtime? · What are EMQ items?

**Exam pattern and logistics** — How many questions and total marks? · Is there
negative marking? · Partial marks for multiple-select? · Is a calculator
allowed? · Online or in person, and where? · How long is it? · When is the hall
ticket released? · Is there a dress code? · Is the syllabus strictly weeks 1–4?
· How much Class 11/12 maths is needed? · Passing marks by category? · Fail one
subject — retake all? · Are formulas provided? · How hard is it; is there a pass
rate? · Where is the answer key? · What if an emergency makes me miss it?

**Preparation** — How do I plan four weeks around school or work? · How many
past papers should I solve? · Are GA questions enough practice? · Best use of
the last three days? · What did 90%+ scorers do? · Catching up on Maths/Stats
from a non-maths background. · Course-specific: relations and functions, number
sets and Venn counting, equations of lines, straight-line fit, quadratics word
problems, polynomial graphs; cases vs variables and scales, charts for
categorical data, how summaries change under shifts and scaling, quartiles/IQR
methods, sample vs population variance, contingency tables and correlation;
CT datasets and cards, tracing flowcharts/pseudocode, filtering with AND/OR,
procedures and side effects, nested iterations and binning; vowel/consonant
sounds and syllables, parts of speech and articles, phrases vs idioms vs
phrasal verbs, what the speaking week tests.

**Results and after qualifying** — When are results released and where do
marks appear? · How many courses can I take in term 1? · Which combination
first? · The registration link is missing — what now? · How long is the result
valid? · Refund if I don't continue?

**Fees and waivers** — Fee structure after qualifying · Who gets waivers and
which documents? · Waiver during the qualifier? · Extra exam-centre charges?

**Electronic Systems** — What do the four ES courses cover each week? · Same
exam day and centres as DS? · How do ES labs and campus visits work?

## 6. Competitor gap analysis

| What competitors do badly     | Evidence (structural observation only)                                                                                           | Our answer                                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stale, unlabelled content     | Top GA site serves 2023 material with conflicting dates and no term label; aggregators keep one URL per term so stale pages rank | Evergreen URLs; visible term label; latest term at the base URL, older terms at `/…/{term}`; "last reviewed" dates; sitemap `lastmod` from real edits |
| Answers without understanding | Option letters, 2–4 minute answer-flash videos, screenshots; GA "sets" differ between students so bare keys mislead              | Concepts tested + a hint per question before the deadline; explained walkthroughs by question type after                                              |
| Ethics                        | Full GA question text reproduced; uploaded past papers; no deadline policy; paid funnels with unverifiable claims                | Deadline-gated solutions enforced in Postgres; `source_permission` on every item; no copied content; no pass-rate claims without a source             |
| Maths as images               | No GA/solution page renders maths as text                                                                                        | KaTeX rendered server-side; accessible tables; printable formula sheets                                                                               |
| Slow, heavy, ad-laden         | 130 KB–1.8 MB HTML, 31–114 scripts, AdSense; best-structured sites are client-rendered shells with <100 words of HTML            | Static generation, minimal client JS, no ad networks, Lighthouse budget in CI                                                                         |
| Weak structure                | No programme → course → week → (notes, GA, practice) taxonomy; ambiguous slugs; placeholder links                                | Database-driven taxonomy with breadcrumbs, prev/next week, cross-course week hubs, internal-link checks                                               |
| Low trust                     | Few citations to study.iitm.ac.in; anonymous or sales-driven authors                                                             | Every guide cites official pages; author/reviewer bylines; corrections via feedback                                                                   |
| Coverage gaps                 | ES week-level content "coming soon" everywhere; no real GA-eligibility or score calculator                                       | ES pages from day one; calculators driven by the cut-offs in site settings                                                                            |

**Cannibalisation note:** the team's existing site (unknowniitians.com) and its
YouTube channel already compete on PYQ and one-shot queries. Decide which
property owns those clusters so the two do not compete for the same results.

**Publishing calendar** (Sep 2026 term): hubs, guides and Week-1 notes/hints
before 2 Oct; each week's notes and hints on release day; walkthroughs after each
GA deadline; exam-pattern, last-week and mock content in early November;
result/re-attempt pages 15–19 November.

## 7. Items the admin should confirm

1. Result validity (DS 3 vs 6 terms; ES "two semesters" vs Handbook 3 terms).
2. Whether the two-stage GA rule in the Handbook applies to your term.
3. Question types, negative marking and calculator rules for the exam.
4. The Sep 2026 application-open date (13 Jul vs 29 Jun) and the December
   re-attempt result date (9 vs 15 Dec).
5. Which week wording the live portal uses where course pages and syllabus
   documents differ (DS English I; ES MA1101 and CS1101).
6. Weekly GA due dates and solution release times for each course (set per
   assignment in the admin).
7. The ES JEE-entry years (ES page still says 2024 and 2025; AE says 2025/2026).

## 8. Sources read

**Official pages**: study.iitm.ac.in — `/`, `/ds/`, `/ds/admissions.html`,
`/ds/academics.html`, `/ds/faq.html`, `/ds/academic_calendar.html`,
`/ds/archive.html`, `/ds/course_pages/{BSMA1001,BSMA1002,BSCS1001,BSHS1001}.html`,
`/es/`, `/es/admissions.html`, `/es/academics.html`, `/es/faq.html`,
`/es/academic_calendar.html`, `/es/course_pages/{HS1101,MA1101,EE1101,CS1101}.html`,
`/ae/` and `/mg/` admissions and academics pages; the Important Dates sheet behind
the admissions pages; onlinedegree.iitm.ac.in (redirects to `/ds/`).

**Official documents**: DS Student Handbook (updated 02-07-2026), ES Student
Handbook, DS and ES Jan 2026 grading documents, DS syllabus PDF (Sep 2025), ES
syllabus document.

**Archived official pages**: Wayback Machine snapshots of the DS and ES
admissions pages (2020–2026) and handbook versions, used for rule history.

**Unofficial** (context only): careers360 admission article (updated
2026-08-31), student subreddits (via archive), Quora question titles,
competitor page titles and structure.
