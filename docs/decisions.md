# Decisions

Short records of the choices that shape this codebase: what was decided, why, and what it costs. Newest last.

## 1. The database is the single source of truth

**Decision.** All content and configuration — programmes, courses, weeks, notes, questions, FAQs, pages, navigation,
footer, redirects, SEO templates and overrides, theme colours, feature flags, qualifier rules, the analytics event
catalogue — lives in Postgres and is edited in `/admin`. Code holds structure and behaviour only.

**Why.** Qualifier rules, dates and syllabus wording change every term. Editors must fix them without a deploy, and
there must be exactly one place to look.

**Cost.** Settings are a single JSON document, so they are validated by a Zod schema (`src/lib/settings/schema.ts`)
whose every field has a safe default. Invalid values never break a page; the settings screen reports which values it
reset.

## 2. Static pages, invalidated by tags from the database

**Decision.** Public pages are prerendered with Next.js Cache Components (`'use cache'`, `cacheLife`, `cacheTag`).
Every data loader tags what it reads (`t:courses`, …). Writes to content tables fire a Postgres trigger that
calls `/api/revalidate` through `pg_net`, with the URL and secret stored in Supabase Vault. Admin saves also
revalidate directly.

**Why.** Students mostly arrive from search on slow mobile connections; static HTML from the edge is the fastest and
cheapest thing to serve, and tag invalidation keeps it fresh within seconds of an edit.

**Cost.** Anything time-dependent must be computed inside the cache boundary. For example, the "released" state of an
assignment is cached data, and the entry's lifetime is capped at the next release time.

## 3. Worked solutions are gated in Postgres, not in the page

**Decision.** Questions are only readable through `get_assignment_questions`, a `security definer` function that returns
`null` for answers, explanations and answer keys until `solutions_release_at`. The table itself is not readable by
visitors. pg_cron pings revalidation at each release time.

**Why.** Hiding answers with CSS or client code leaks them to anyone who views the source or the RSC payload. The
deadline is an academic-integrity commitment, so it is enforced where the data lives.

**Cost.** A release happens within about a minute of the scheduled time (the cron granularity), not to the second.

## 4. MDX is compiled without `eval`, from an allow-list

**Decision.** MDX from the database is parsed (remark), sanitised against an allow-list of components and HTML
elements with string-only props, converted to HTML AST and rendered with `hast-util-to-jsx-runtime`. Imports, exports
and `{expressions}` are removed; unknown components are unwrapped. If parsing fails, the content is shown as plain
Markdown instead of an error page.

**Why.** Content is written by editors, but it is still input. Compiling it to JavaScript and running it would turn
any compromised editor account into code execution on the server.

**Cost.** Authors cannot write arbitrary JSX. New interactive pieces are added as allow-listed components
(`src/lib/mdx/allowed.ts`).

## 5. Search runs in Postgres

**Decision.** A materialised view (`private.search_index`) holds every live programme, course, week hub, assignment,
note, page and FAQ with a weighted `tsvector` and a trigram-indexed heading. It is refreshed within a minute of a
change. The app parses course aliases, week numbers and content types out of the query ("maths 1 wk 2 ga") and passes
them as filters; a direct hit takes the student straight to the page.

**Why.** The corpus is small (thousands of rows), so a hosted search service would add cost, a sync pipeline and a
third-party dependency for no gain.

**Cost.** Relevance tuning happens in SQL (`search_content`).

## 6. Shared course names resolve to the first programme

**Decision.** When the same words name courses in several programmes ("english 1", "maths 1"), search picks the course
in the first programme (by programme order) and offers the others as alternatives. Previously the query was left
unresolved.

**Why.** Leaving it unresolved gave students almost no results for the most common queries. Data Science students
are the majority, and the alternatives keep Electronic Systems one tap away.

## 7. First-party, consent-aware analytics

**Decision.** A small tracker (`src/lib/analytics/client.ts`) sends batched events to `/api/track`. There are two consent
levels: _essential_ (pseudonymous, always on) and _detailed_ (linked to the account, opt-in, 18+). Global Privacy
Control is respected. Raw IPs are never stored — only a daily-rotating HMAC. Raw events are purged after the
retention period; daily rollups (computed in IST) are kept. No third-party analytics scripts are loaded.

**Why.** The DPDP Act 2023 requires clear consent and purpose limitation, and third-party scripts cost performance and
trust. The admin still needs real answers: which pages help, which searches fail, where students drop off.

**Cost.** The dashboard reads rollups that refresh hourly (and on demand), not live data.

## 8. Real status codes

**Decision.** Unknown slugs render a real 404. Aliases, cross-listed courses and old URLs return 308s, resolved in the
page's not-found branch from a cached redirect map. The proxy only lowercases URLs and guards signed-in areas.

**Why.** Soft 404s and redirect chains waste crawl budget and split ranking signals. Keeping the proxy narrow keeps
static pages static.

## 9. Thin pages are hidden from Google, not from students

**Decision.** A week hub with no published notes, assignments or resources is `noindex` and left out of the sitemap,
but it stays reachable and appears in site search.

**Why.** An empty hub is thin content to Google, yet for a student it still lists the official topics and is the right
answer to "maths 1 week 2".

## 10. Files are private by default

**Decision.** Downloadable files are uploaded to Cloudinary with `authenticated` delivery and served only through
`/api/download/[id]`, which counts the download, applies rate limits and redirects to a signed URL that expires in
minutes. Images use normal delivery with automatic format and quality.

**Why.** Public file URLs get hot-linked and scraped, and downloads could not be counted.

## 11. Google-only sign-in, behind a flag

**Decision.** The only sign-in method is Google OAuth through Supabase Auth, controlled by `features.login` and by
whether the provider is enabled. Until then the login page says "coming soon".

**Why.** Students already have Google accounts. Passwords add a reset flow, breach risk and support load.

**Consequence.** The Supabase email provider should be disabled so nobody can create accounts through the API.

## 12. A config-driven admin

**Decision.** Each table is described once (`src/lib/admin/resources.ts`: fields, list columns, search, publishing,
revisions). One list view, one form and one set of server actions serve all of them, with a quality gate before
publishing.

**Why.** Seventeen tables with hand-built forms would drift apart and be expensive to change. A new column is one line.

## 13. Colours are tokens, and contrast is checked

**Decision.** Every colour is a CSS variable generated from `site_settings.theme` (light and dark). The theme editor
flags any required pair that fails WCAG AA. Chart colours (for example the funnel ramp) were validated separately
against both surfaces.

**Why.** Rebranding should be a settings change, and a rebrand must not silently break accessibility.

## 14. Hosting next to the database

**Decision.** Vercel functions run in `syd1`, the region closest to the Supabase project.

**Why.** Every dynamic request talks to Postgres; putting the function next to it saves 150–250 ms per round trip.
Static pages come from the global edge regardless.

## 15. Open question: overlap with the team's other site

The team's existing site and YouTube channel already target past-paper and one-shot queries. Decide which property
owns those keyword clusters (record it in **Admin → Keyword notes**) so the two sites do not compete for the same
results.
