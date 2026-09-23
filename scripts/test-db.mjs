#!/usr/bin/env node
/**
 * Runs supabase/tests/*.test.sql against the linked project inside a
 * transaction that is always rolled back, so fixtures never persist.
 *
 *   npm run test:db
 */
import { readdir, readFile } from 'node:fs/promises'

import { runSql } from './supabase-sql.mjs'

const dir = new URL('../supabase/tests/', import.meta.url)
const files = (await readdir(dir)).filter((name) => name.endsWith('.test.sql')).sort()

let failed = 0
for (const file of files) {
  const sql = await readFile(new URL(file, dir), 'utf8')
  try {
    const result = await runSql(`begin;\n${sql}\nrollback;`)
    console.log(`✔ ${file}: ${JSON.stringify(result)}`)
  } catch (error) {
    failed += 1
    console.error(`✖ ${file}\n  ${error instanceof Error ? error.message : String(error)}`)
  }
}

process.exit(failed > 0 ? 1 : 0)
