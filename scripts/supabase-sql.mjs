/**
 * Runs SQL against the linked Supabase project through the Management API.
 * Used by the db:seed and test:db scripts so neither needs a database
 * password — only SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF.
 */

export async function runSql(query) {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  const ref = process.env.SUPABASE_PROJECT_REF
  if (!token || !ref) {
    throw new Error('Set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF (see .env.example).')
  }

  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  const text = await response.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  if (!response.ok) {
    const message = typeof body === 'object' && body?.message ? body.message : text
    throw new Error(`Query failed (${response.status}): ${message}`)
  }
  return body
}
