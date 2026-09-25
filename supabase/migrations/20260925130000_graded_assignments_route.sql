-- /graded-assignments is a fixed route (every graded assignment by
-- programme, course and week); a programme may not shadow it.
alter table public.programs drop constraint programs_slug_not_reserved;
alter table public.programs add constraint programs_slug_not_reserved check (slug not in (
  'about', 'admin', 'api', 'auth', 'blog', 'contact', 'dashboard', 'graded-assignments', 'login',
  'logout', 'notes', 'offline', 'onboarding', 'privacy', 'pyq', 'qualifier', 'resources', 'search',
  'sitemaps', 'terms'
));
