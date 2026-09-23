#!/usr/bin/env node
/**
 * Applies supabase/seed.sql to the linked project, then refreshes the search
 * index. The seed is idempotent, so running it twice is safe.
 *
 *   npm run db:seed
 */
import { readFile } from 'node:fs/promises'

import { runSql } from './supabase-sql.mjs'

const seed = await readFile(new URL('../supabase/seed.sql', import.meta.url), 'utf8')

await runSql(`begin;\n${seed}\ncommit;`)
await runSql('select private.refresh_search_index(true);')

const [counts] = await runSql(`
  select
    (select count(*) from public.programs) as programs,
    (select count(*) from public.courses) as courses,
    (select count(*) from public.weeks) as weeks,
    (select count(*) from public.pages) as pages,
    (select count(*) from public.faqs) as faqs,
    (select count(*) from public.event_definitions) as event_definitions
`)

console.log('Seed applied:', counts)
