-- ─────────────────────────────────────────────────────────────────────────────
-- Sitemap and link index run with the owner's rights.
--
-- Both read only the private.live_* views, which already keep to live,
-- published rows, so row level security on the tables underneath adds nothing
-- but cost. As the anon role the sitemap query took about 0.6 s on its own and
-- hit anon's 3 s statement timeout when a build ran many queries at once,
-- which left empty sitemaps. search_path stays empty, so the functions resolve
-- only schema-qualified names.
-- ─────────────────────────────────────────────────────────────────────────────

alter function public.get_sitemap_entries() security definer;
alter function public.get_link_index() security definer;
