# Qualifier Hub

A fast, search-friendly study companion for the **IIT Madras BS qualifier** (Data Science and Electronic Systems):
week-by-week course hubs, graded-assignment hints and deadline-gated worked solutions, notes, formula sheets,
eligibility and score calculators, and a full admin CMS with analytics.

Everything a visitor sees — programmes, courses, weeks, notes, questions, FAQs, navigation, SEO templates, theme
colours, qualifier rules — comes from the database and is edited in `/admin`. Nothing content-related is hard-coded.

**Live:** https://iitmbs-delta.vercel.app

## Contents

- [Stack](#stack)
- [What is in the box](#what-is-in-the-box)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Deploying to Vercel](#deploying-to-vercel)
- [Adding content](#adding-content)
- [Becoming an admin](#becoming-an-admin)
- [Scripts](#scripts)
- [Project layout](#project-layout)
- [Further reading](#further-reading)

## Stack

| Concern       | Choice                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router, Cache Components, `proxy.ts`), React 19, TypeScript (strict)                  |
| Styling       | Tailwind CSS 4 with design tokens as CSS variables (editable from the admin), Poppins                 |
| Data and auth | Supabase: Postgres 17 with Row Level Security everywhere, Auth (Google), pg_cron, pg_net, Vault       |
| Content       | MDX stored in Postgres, compiled without `eval`: KaTeX maths, Shiki code, an allow-list of components |
| Search        | Postgres full-text search plus trigram typo tolerance, with course/week/type understanding            |
| Files         | Cloudinary: signed uploads, private files served only through tracked, short-lived links              |
| Validation    | Zod (environment, settings, every API input)                                                          |
| Testing       | Vitest (unit), SQL security tests against the real schema, Playwright (end to end), Lighthouse CI     |
| Hosting       | Vercel (`syd1`, next to the Supabase region)                                                          |

## What is in the box

**For students**

- Programme → course → week hubs with official topics, notes, graded (GA) and practice (PA) assignments, formula
  sheets and qualifier-exam prep. Past terms are archived at stable URLs.
- Hints before the deadline; worked solutions unlock automatically at the release time. Answers are withheld **by the
  database** until then, not just hidden in the page.
- Eligibility and score calculators driven by the rules stored in settings.
- Search with `Ctrl/⌘ K` that understands how students type: "maths 1 week 2 ga", "ct wk3 answers", "stats formula
  sheet". Shared course names ("english 1") go to the first programme and offer the other.
- Google sign-in (feature-flagged; the login page says "coming soon" until the provider is switched on) for bookmarks,
  progress ticks, reading history, data export and account deletion.
- Installable PWA: recently read pages work offline.
- WCAG 2.2 AA colours in a light, three-colour theme, keyboard support throughout, mobile-first down to 360 px.

**For search engines**

- Per-page titles and descriptions from admin-editable templates, canonical URLs, `noindex` for thin or private pages,
  generated Open Graph images, JSON-LD (Organization, WebSite + SearchAction, BreadcrumbList, Course, FAQPage,
  LearningResource, Quiz, Person).
- A sitemap index split by section, `robots.txt`, real 404s for unknown URLs, 308 redirects for aliases and old URLs,
  and IndexNow pings when something is published.

**For the team (`/admin`)**

- A config-driven editor for every table: MDX editor with live preview and image upload, IST date pickers,
  draft/scheduled/live states, a pre-publish quality gate (thin content, missing descriptions, broken MDX, missing
  sources…), revision history with restore, soft delete, bulk CSV/JSON import.
- Settings (site identity, features, SEO templates, qualifier rules, theme colours with live contrast checks),
  navigation, redirects, SEO overrides, keyword notes, an SEO report, users and roles, feedback triage, audit log.
- First-party analytics: visitors, trends, top pages, sources, devices, search queries (including zero-result ones),
  a visit-to-sign-in funnel, content performance with CSV export, movers and Core Web Vitals by page type.

## Getting started

Requirements: Node.js 24 (see `.nvmrc`) and a Supabase project. Cloudinary is optional.

```bash
nvm use
npm install
cp .env.example .env.local     # then fill it in (see below)
npm run db:link                # once, links the Supabase CLI to your project
npm run db:push                # applies supabase/migrations
npm run db:seed                # programmes, courses, weeks, pages, FAQs, settings, event catalogue
npm run dev                    # http://localhost:3000
```

The seed is idempotent. Seeded notes and assignments are drafts with placeholder release times; publish them from the
admin once they are written.

## Environment variables

Every variable is documented in [`.env.example`](.env.example) and validated at start-up by `src/env.ts`. Only
`NEXT_PUBLIC_*` values reach the browser.

| Variable                                                                                                       | Required    | Purpose                                                                                    |
| -------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`                                                                                         | yes         | Canonical origin (sitemaps, canonicals, OG, auth redirects)                                |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`                                                    | yes         | Supabase project and publishable key                                                       |
| `SUPABASE_SERVICE_ROLE_KEY`                                                                                    | recommended | Server-only: analytics ingest, download counts, account deletion (off without it)          |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`                                                                | scripts     | CLI and Management API (migrations, seed, DB tests, types)                                 |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_FOLDER` | optional    | Uploads and tracked downloads                                                              |
| `REVALIDATE_SECRET`                                                                                            | recommended | Authenticates the database's publish webhook; without it pages refresh on their timer only |
| `INDEXNOW_KEY`                                                                                                 | optional    | IndexNow pings on publish                                                                  |
| `ANALYTICS_HASH_SECRET`                                                                                        | recommended | Daily-rotating HMAC for IP hashing and rate limits (raw IPs are never stored)              |

## Database

All schema lives in [`supabase/migrations`](supabase/migrations), applied in order:

| Migration                                      | What it adds                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `foundation`                                   | `private` schema, enums, domains, shared triggers, MDX-to-text helpers       |
| `content_taxonomy`                             | programmes, courses (with cross-listing), weeks, authors, media              |
| `profiles_and_roles`                           | profiles, roles (student/editor/admin), role guard and the admin role RPC    |
| `content_items`                                | assignments, questions, notes, resources, FAQs, pages                        |
| `site_config`                                  | settings, navigation, footer, redirects, SEO overrides, keyword notes        |
| `content_access`                               | RLS policies for public and staff access                                     |
| `solutions_gate`                               | `get_assignment_questions`: answers are `null` before `solutions_release_at` |
| `user_features`                                | bookmarks, progress, reading history                                         |
| `analytics` / `analytics_reporting`            | sessions, events, page views, downloads, searches, rollups, admin reports    |
| `audit_and_revisions`                          | audit log for every table and revision snapshots for long-form content       |
| `routing`, `link_index`, `programme_week_hubs` | canonical paths, sitemap entries, route manifest                             |
| `search`, `search_all_week_hubs`               | materialised search index and `search_content`                               |
| `publishing_hooks`, `scheduled_jobs`           | publish webhook (pg_net + Vault) and pg_cron jobs                            |
| `hardening`                                    | explicit grants, `PUBLIC` execute revoked, foreign-key indexes               |

**One-time setup after `db:push`** — store the publish webhook target in Vault (SQL editor):

```sql
select vault.create_secret('https://<your-domain>/api/revalidate', 'site_revalidate_url');
select vault.create_secret('<REVALIDATE_SECRET>', 'revalidate_secret');
```

Then set **Authentication → URL configuration**: Site URL = your domain, and add
`https://<your-domain>/auth/callback` to the redirect allow list. Google sign-in is described in
[docs/google-auth-setup.md](docs/google-auth-setup.md).

`npm run test:db` runs [`supabase/tests/security.test.sql`](supabase/tests/security.test.sql) against the linked
project inside a transaction that is always rolled back. It checks RLS, the solutions gate, consent handling, rate
limits, search and the route manifest.

## Deploying to Vercel

1. Import the repository in Vercel (framework: Next.js). `vercel.json` pins functions to `syd1`; change it to the
   region closest to your Supabase project.
2. Add the environment variables above for Production and Preview. Mark secrets as sensitive.
3. Deploy. Every push to `main` deploys automatically.
4. After the first deploy: create the Vault secrets, set the Supabase auth URLs, submit
   `https://<your-domain>/sitemap.xml` in Google Search Console and Bing Webmaster Tools, and paste their verification
   codes into **Admin → Settings → Contact & social**.

Preview deployments send `Disallow: /` in `robots.txt` so they never compete with production.

## Adding content

Start with [docs/content-guidelines.md](docs/content-guidelines.md). In short:

1. **Admin → Weeks**: check the week's official topics.
2. **Admin → Assignments → New**: pick the course and week, type (graded/practice), term (`2026-sep`), the due time
   and the **solution release time** (IST). Add questions one by one or with **Bulk import**.
3. **Admin → Notes → New** for week notes, topic notes, a formula sheet or exam prep.
4. Tick **Published** (or set **Go live at**). The quality gate lists anything that would hurt the page; fix it or save
   anyway. Publishing refreshes the affected pages, updates search and pings IndexNow.

Every item records its **source**: original, shared with permission, or an official link. Never paste material you do
not have the right to publish.

## Becoming an admin

Sign in once with Google (so a profile exists), then run in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

After that, promote other people from **Admin → Users**. Editors can write and publish content; admins can also change
settings, navigation, redirects, roles and see analytics. Admins cannot demote themselves.

## Scripts

| Command                   | What it does                                    |
| ------------------------- | ----------------------------------------------- |
| `npm run dev`             | Development server                              |
| `npm run build` / `start` | Production build / server                       |
| `npm run check`           | Lint, type-check, format check and unit tests   |
| `npm run test`            | Unit tests (Vitest)                             |
| `npm run test:e2e`        | End-to-end tests (Playwright)                   |
| `npm run lhci`            | Lighthouse CI against a local production build  |
| `npm run test:db`         | SQL security tests against the linked project   |
| `npm run db:push`         | Apply migrations                                |
| `npm run db:seed`         | Apply the idempotent seed and refresh search    |
| `npm run db:types`        | Regenerate `src/lib/supabase/database.types.ts` |

## Project layout

```
src/
  app/(public)/      student-facing routes (programme/course/week hubs, notes, assignments, qualifier guides, dashboard)
  app/(auth)/        login and onboarding
  app/admin/         the CMS and analytics
  app/api/           search, tracking, feedback, downloads, revalidation, personal data, admin helpers
  components/        UI grouped by area (content, assignment, mdx, admin, charts, layout…)
  lib/data/          cached, typed data access — pages never query tables directly
  lib/mdx/           MDX pipeline and sanitiser
  lib/seo/           metadata, JSON-LD, sitemaps
  lib/analytics/     tracker, ingest and schemas
  lib/admin/         field model, resources, quality gate, analytics loaders
supabase/            migrations, seed and SQL tests
tests/               unit and end-to-end tests
docs/                research, decisions and guides
```

## Further reading

- [docs/research.md](docs/research.md) — verified qualifier facts, keyword research, competitor gaps
- [docs/decisions.md](docs/decisions.md) — why things are built the way they are
- [docs/content-guidelines.md](docs/content-guidelines.md) — writing, MDX components, SEO and sourcing rules
- [docs/analytics-events.md](docs/analytics-events.md) — every tracked event, consent levels and retention
- [docs/google-auth-setup.md](docs/google-auth-setup.md) — turning on Google sign-in
