# Content guidelines

How to write for Qualifier Hub so pages help students, rank in search, and stay on the right side of academic
integrity. Everything here is done in `/admin`.

## Principles

1. **Explain, don't just answer.** Students remember a method, not an option letter. Every graded-assignment page
   leads with the concepts tested and a hint per question; the worked solution comes after the deadline.
2. **Respect the deadline.** Worked solutions are released only after the official due time. Set **Release worked
   solutions at** to after the due time — the database refuses a graded assignment whose release is before its due
   time, and keeps answers hidden until the release time.
3. **Only publish what you have the right to publish.** Every note, assignment, question, resource and image records
   its **Source**:
   - _Original_ — written by our team.
   - _Shared with permission_ — someone gave us written permission; add the source URL.
   - _Official source_ — a summary of an official IIT Madras page, linked in **Source URL**.

   Never copy question text, videos, slides or PDFs from the portal or from other websites. Paraphrase the idea, change
   the numbers, and cite the official page for rules and dates.

4. **Be accurate and dated.** Rules change each term. Link official pages, set **Last reviewed** when you check a page,
   and keep the qualifier rules in **Settings → Qualifier rules** current (the calculators read them).
5. **Write for a phone.** Short paragraphs, one idea per section, tables that fit a narrow screen.

## Page types

| Page                     | Where                                 | What it needs                                                                                                                                 |
| ------------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Week hub                 | **Weeks**                             | Official topics (from the course page), a one-line summary, optional overview                                                                 |
| Graded assignment (GA)   | **Assignments**, type _Graded_        | Term, due time, release time, "What this assignment covers", concepts tested, questions with hints, answers and explanations, common mistakes |
| Practice assignment (PA) | **Assignments**, type _Practice_      | As above; solutions can be released immediately                                                                                               |
| Week notes               | **Notes**, kind _Week notes_          | The week, a clear title, sections per topic, worked examples, links to the GA and PA                                                          |
| Topic note               | **Notes**, kind _Topic note_          | One concept explained end to end, with a slug that reads well (`/notes/quartiles-and-percentiles`)                                            |
| Formula sheet            | **Notes**, kind _Formula sheet_       | Every formula from the qualifier weeks, grouped by week, printable                                                                            |
| Exam prep                | **Notes**, kind _Qualifier exam prep_ | What to revise, question patterns, practice sets, common mistakes                                                                             |
| Guide or legal page      | **Pages**                             | Path (`qualifier/timeline`), summary, official sources, template _Guide_ or _Legal_                                                           |
| Blog post                | **Blog posts**                        | Slug (`/blog/<slug>`), category, summary, tags, official sources; one search question per post                                                |

Blog posts live at `/blog/<slug>` and belong to one **Blog category** (`/blog/category/<slug>`). The blog home page is
the page with path `blog` in **Pages**: its title, summary and intro are edited there. Posts that share **Tags** are
shown to each other as "Read next", and **Featured** posts appear under "Start here" on the blog home. Write blog posts
in plain, simple English, answer the question in the first two sentences, and link the official handbook in **Official
sources**.

The term for an assignment is written `YYYY-jan`, `YYYY-may` or `YYYY-sep` (for example `2026-sep`). The newest term
lives at the base URL (`/data-science/maths-1/week-2/graded-assignment`); older terms move to
`…/graded-assignment/2026-may` automatically.

## Writing in MDX

Content is Markdown with a few components. Imports, exports and `{curly expressions}` are removed for safety, and
unknown components are ignored — the editor's preview shows exactly what will be published and lists anything it
removed.

**Headings.** The page title is the only H1 and is added for you. Start sections at `##`, use `###` inside them, and
never skip a level.

**Maths.** Inline `$x^2 + 1$`, display blocks with `$$ … $$` on their own lines. It is rendered on the server with
KaTeX, so it is real text that search engines and screen readers can read.

**Code.** Fenced blocks with a language get highlighting and a copy button:

````md
```python
print(sum(range(10)))
```
````

**Tables.** Use Markdown tables with a header row. Keep them to about four columns so they fit a phone.

**Images.** Upload from the editor's **Image** button; you must describe the image (alt text). This inserts
`![A labelled number line from -3 to 3](cloudinary:qualifier-hub/images/number-line)`. For a caption, use
`<Figure src="cloudinary:…" alt="…" caption="…" />`. Images are resized and converted automatically.

### Components

| Component                                 | Use it for                                                        | Example                                                              |
| ----------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| `Callout`                                 | A tip, note or warning (`type`: `info`, `tip`, `warning`, `note`) | `<Callout type="tip" title="Shortcut">Text</Callout>`                |
| `KeyIdea`                                 | The one thing to remember from a section                          | `<KeyIdea title="Slope">Rise over run.</KeyIdea>`                    |
| `Steps`                                   | A numbered method                                                 | `<Steps>` + a numbered list + `</Steps>`                             |
| `Definition`                              | A term and its meaning                                            | `<Definition term="Median">The middle value…</Definition>`           |
| `RelatedLink`                             | A link card to another page on the site                           | `<RelatedLink href="/qualifier/eligibility" />`                      |
| `Figure`                                  | An image with a caption                                           | `<Figure src="cloudinary:…" alt="…" caption="…" />`                  |
| `YouTube`                                 | A video (loads only when played)                                  | `<YouTube id="dQw4w9WgXcQ" title="Week 2 walkthrough" start="90" />` |
| `SyllabusOverview`                        | The week-by-week topics of a programme                            | `<SyllabusOverview program="data-science" />`                        |
| `EligibilityCalculator`                   | The GA eligibility calculator                                     | `<EligibilityCalculator />`                                          |
| `ScoreCalculator`                         | The qualifier score calculator                                    | `<ScoreCalculator />`                                                |
| `SiteName`, `ContactEmail`, `ContactLink` | Values from settings, so they never go stale                      | `Write to <ContactEmail />.`                                         |

Allowed HTML: `sup`, `sub`, `br`, `kbd`, `abbr title`, `mark`, `small`, `u`, `s`, `del`, `ins`, `details`/`summary`.

`RelatedLink` reads the target page's current title, so links stay correct when pages are renamed. Link with site
paths (`/data-science/stats-1/week-3`), never full URLs to this site.

## Questions

- **Type:** single choice (MCQ), multiple select (MSQ), numerical, or short answer.
- **Options:** added with **Add option**; they are lettered a, b, c… automatically.
- **Answer key** (JSON, hidden until release):
  - MCQ/MSQ: `{"correct": ["b"]}` or `{"correct": ["a", "c"]}`
  - Numerical: `{"value": 3.5, "tolerance": 0.01}`
  - Short answer: `{"accepted": ["mean", "average"]}`
- **Hint:** shown before the deadline. Point at the concept, not the option.
- **Explanation:** the full method, shown after release.
- Many questions at once: **Bulk import** accepts CSV or JSON; the page lists every column and shows row-by-row errors
  before anything is saved.

## Search engines

- **Titles and descriptions** come from the templates in **Settings → SEO**. Only set an _SEO title_ when a page needs
  something different; keep it under about 60 characters. A _meta description_ of 120–155 characters that says exactly
  what the page gives the student earns more clicks.
- **One page per search intent.** Before creating a page, check **Keyword notes** and the **SEO report**. If another
  page already targets the same query, improve that page instead.
- **Depth.** Notes and guides under the minimum word count (Settings → Analytics & content) rarely rank. Add worked
  examples, common mistakes and practice, or merge the page into a stronger one.
- **Internal links.** Every note and guide should link to the related week, assignment or guide.
- **Freshness.** Update **Last reviewed** when you check a page; the SEO report lists pages that have not been touched
  for a while.
- **Hidden pages.** A week hub with no published content is automatically hidden from Google until it has some. Use the
  _noindex_ option only for pages that should never appear in search.

## Publishing

1. Save as a draft while writing; the preview uses the real rendering pipeline.
2. Tick **Published**, or set **Go live at** (India time) to schedule it.
3. The **quality check** lists anything likely to hurt the page — thin content, missing description, broken MDX, no
   internal links, missing source URL, placeholder release time. Fix it, or tick **Save anyway**.
4. On publish the site refreshes the affected pages within seconds, adds the page to search within a minute, and
   notifies search engines through IndexNow.
5. Every save is kept in **History**, where any earlier version can be restored.

## Accessibility checklist

- Alt text on every informative image (what it shows, not "image of").
- Link text that makes sense on its own ("Maths 1 Week 2 notes", not "click here").
- Headings in order, tables with a header row, no meaning carried by colour alone.
- Maths written as maths (`$…$`), not as screenshots.
