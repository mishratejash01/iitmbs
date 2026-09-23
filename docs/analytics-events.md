# Analytics events

Qualifier Hub uses its own first-party analytics — no third-party scripts. This page lists every event, what is
stored, and how consent changes it. The authoritative catalogue is the `event_definitions` table (**Admin → Event
catalogue**); `/api/track` rejects any event that is not active there.

## How data flows

1. The tracker in the browser (`src/lib/analytics/client.ts`) batches events and sends them to `POST /api/track`
   (with `sendBeacon` when the page is closing). Components opt in with `data-track` attributes, so most tracking is
   a few delegated listeners rather than code per component.
2. `/api/track` validates the payload with Zod, drops bots, applies per-visitor and per-IP rate limits, keeps only
   catalogued events and passes them to `ingest_events()` in Postgres with the service role.
3. Some events are recorded by the server itself (`download_complete`, `search_query`, `search_zero_results`, sign-in
   events), so ad blockers cannot hide them.
4. `compute_daily_rollup()` turns raw rows into daily totals in the reporting time zone (IST by default). pg_cron runs
   it hourly for today and once more for yesterday after midnight. The admin dashboard reads only rollups.
5. `purge_old_analytics()` deletes raw rows older than **Settings → Analytics → Keep raw analytics** (13 months by
   default). Rollups are kept.

## Consent

| Level                   | Who                                                      | What is stored                                                                                             |
| ----------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Essential** (default) | Everyone, including visitors who choose "Essential only" | Pseudonymous: a random visitor ID and session ID, page, device class, country and region. No account link. |
| **Detailed** (opt-in)   | Signed-in students aged 18+ who choose "Allow detailed"  | The same events linked to the account, which powers reading history and progress, plus city.               |

- A browser sending **Global Privacy Control** (`Sec-GPC: 1`) is always treated as essential.
- The admin is never tracked.
- Raw IP addresses are never stored. A daily-rotating HMAC of the IP (`ANALYTICS_HASH_SECRET`) is used only for rate
  limits and unique counts, and cannot be linked across days.
- Students can change their choice at any time (footer link or **Dashboard → Settings**), download everything linked to
  their account, or delete the account.

## Cookies

| Cookie       | Purpose                                                                     | Lifetime       |
| ------------ | --------------------------------------------------------------------------- | -------------- |
| `qh_aid`     | Random visitor ID (not linked to identity)                                  | 1 year         |
| `qh_sid`     | Session ID, renewed on activity; a new session starts after 30 idle minutes | 30 minutes     |
| `qh_consent` | The analytics choice                                                        | 1 year         |
| `qh_user`    | Display name and avatar for the header (signed in)                          | 30 days        |
| `sb-*`       | Supabase session (signed in)                                                | Until sign-out |

## Adding an event

1. Add a row in **Admin → Event catalogue** (name in `snake_case`, category, description, properties).
2. Add the name to `CLIENT_EVENTS` in `src/lib/analytics/events.ts` if the browser sends it.
3. Send it with `track('name', { … })` or a `data-track="name"` attribute. Properties must be flat strings, numbers or
   booleans — never names, emails or free text a student typed.

## Event reference

"Raw" means each occurrence is stored as a row; events that are not raw only update another table (for example
heartbeats add engaged time to the page view) or daily totals.

### Session

| Event                   | What it means                                                      | Properties     | Raw | Sent by |
| ----------------------- | ------------------------------------------------------------------ | -------------- | --- | ------- |
| `session_end`           | Tab hidden or closed; closes the session and records its duration. | —              | no  | browser |
| `session_start`         | First event of a visit (new session identifier).                   | `landing_path` | yes | browser |
| `tab_visibility_change` | The tab became visible or hidden.                                  | `state`        | yes | browser |

### Navigation

| Event                 | What it means                                           | Properties                                                   | Raw | Sent by |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------ | --- | ------- |
| `breadcrumb_click`    | Click on a breadcrumb.                                  | `href`, `position`                                           | yes | browser |
| `internal_link_click` | Click on a link to another page of this site.           | `area`, `href`, `label`                                      | yes | browser |
| `nav_click`           | Click in the header, programme switcher or mobile menu. | `href`, `label`                                              | yes | browser |
| `outbound_link_click` | Click on a link to another website.                     | `host`, `href`                                               | yes | browser |
| `page_view`           | A page was viewed (also creates a page_views row).      | `is_entry`, `search_query`, `referrer_host`, `search_engine` | yes | browser |

### Content

| Event                | What it means                                                                         | Properties                               | Raw | Sent by |
| -------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------- | --- | ------- |
| `code_copy`          | A code block copy button was used.                                                    | `length`, `language`                     | yes | browser |
| `copy_text`          | Text was copied from the page.                                                        | `length`                                 | yes | browser |
| `formula_sheet_open` | A formula sheet was opened.                                                           | `course`                                 | yes | browser |
| `hint_reveal`        | A question hint was revealed.                                                         | `position`, `question_id`                | yes | browser |
| `print_click`        | The print button on a formula sheet or note was used.                                 | `page_type`                              | yes | browser |
| `scroll_depth`       | Deepest scroll milestone reached (25/50/75/100). Folded into page_views.max_scroll.   | `depth`                                  | no  | browser |
| `solution_gate_seen` | The "walkthrough unlocks after the deadline" gate was shown.                          | `assignment_id`, `seconds_until_release` | yes | browser |
| `solution_view`      | A released walkthrough was opened.                                                    | `position`, `question_id`                | yes | browser |
| `time_on_page`       | Heartbeat every 15s while the tab is visible. Folded into page_views.engaged_seconds. | `seconds`                                | no  | browser |
| `toc_click`          | Click in a table of contents.                                                         | `level`, `heading`                       | yes | browser |

### Engagement

| Event              | What it means                              | Properties                     | Raw | Sent by |
| ------------------ | ------------------------------------------ | ------------------------------ | --- | ------- |
| `bookmark_add`     | A page was bookmarked.                     | `path`                         | yes | browser |
| `bookmark_remove`  | A bookmark was removed.                    | `path`                         | yes | browser |
| `consent_update`   | The analytics consent choice changed.      | `level`                        | yes | browser |
| `feedback_helpful` | Answered "Was this helpful?".              | `helpful`, `has_comment`       | yes | browser |
| `progress_toggle`  | A progress checkbox was ticked or cleared. | `done`, `item_id`, `item_type` | yes | browser |
| `share_click`      | A share button was used.                   | `channel`                      | yes | browser |
| `theme_toggle`     | Light/dark mode was changed.               | `theme`                        | yes | browser |

### Search

| Event                 | What it means                                               | Properties                        | Raw | Sent by |
| --------------------- | ----------------------------------------------------------- | --------------------------------- | --- | ------- |
| `search_query`        | A search was run (logged server-side in searches).          | `query`, `results_count`          | no  | server  |
| `search_result_click` | A search result was opened.                                 | `target`, `position`, `search_id` | yes | browser |
| `search_zero_results` | A search returned nothing (logged server-side in searches). | `query`                           | no  | server  |

### Downloads

| Event               | What it means                                                            | Properties                               | Raw | Sent by |
| ------------------- | ------------------------------------------------------------------------ | ---------------------------------------- | --- | ------- |
| `download_click`    | A download or resource link was clicked (client side).                   | `kind`, `resource_id`                    | yes | browser |
| `download_complete` | Server-confirmed download issued by /api/download (stored in downloads). | `file_type`, `file_bytes`, `resource_id` | no  | server  |

### Account

| Event                 | What it means                                  | Properties           | Raw | Sent by              |
| --------------------- | ---------------------------------------------- | -------------------- | --- | -------------------- |
| `login_click`         | The sign-in button was clicked.                | `source`, `provider` | no  | browser              |
| `login_failure`       | Sign-in failed.                                | `reason`, `provider` | no  | server (and browser) |
| `login_success`       | Sign-in completed.                             | `provider`           | no  | server (and browser) |
| `logout`              | The user signed out.                           | —                    | no  | server (and browser) |
| `onboarding_complete` | Programme and term chosen after first sign-in. | `term`, `program`    | no  | browser              |
| `signup_first_login`  | First ever sign-in for this account.           | `provider`           | no  | server (and browser) |

### Errors

| Event       | What it means                                        | Properties                  | Raw | Sent by |
| ----------- | ---------------------------------------------------- | --------------------------- | --- | ------- |
| `404_hit`   | A page was not found.                                | `path`, `referrer`          | yes | browser |
| `api_error` | A client request to our API failed.                  | `status`, `endpoint`        | yes | browser |
| `js_error`  | An uncaught JavaScript error or unhandled rejection. | `line`, `source`, `message` | yes | browser |

### Performance

| Event       | What it means                                                              | Properties                  | Raw | Sent by |
| ----------- | -------------------------------------------------------------------------- | --------------------------- | --- | ------- |
| `web_vital` | Core Web Vitals sample (LCP, CLS, INP, TTFB, FCP). Folded into page_views. | `value`, `metric`, `rating` | no  | browser |
