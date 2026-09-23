-- ─────────────────────────────────────────────────────────────────────────────
-- Background jobs (pg_cron, UTC schedules).
--
--   qh-search-refresh        every minute   refresh search index if content changed
--   qh-scheduled-revalidate  every minute   go-live + solution-release revalidation
--   qh-rollup-today          hourly :07     recompute today's analytics rollup
--   qh-rollup-yesterday      19:20 UTC      final rollup for the previous day (00:50 IST)
--   qh-analytics-purge       20:40 UTC      delete raw analytics past retention
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;

select cron.schedule(
  'qh-search-refresh',
  '* * * * *',
  $$select private.refresh_search_index()$$
);

select cron.schedule(
  'qh-scheduled-revalidate',
  '* * * * *',
  $$select private.revalidate_scheduled_content()$$
);

select cron.schedule(
  'qh-rollup-today',
  '7 * * * *',
  $$select private.compute_daily_rollup((now() at time zone private.report_tz())::date)$$
);

select cron.schedule(
  'qh-rollup-yesterday',
  '20 19 * * *',
  $$select private.compute_daily_rollup((now() at time zone private.report_tz())::date - 1)$$
);

select cron.schedule(
  'qh-analytics-purge',
  '40 20 * * *',
  $$select private.purge_old_analytics()$$
);
