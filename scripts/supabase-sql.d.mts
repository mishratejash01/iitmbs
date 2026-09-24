/** Types for supabase-sql.mjs: runs SQL through the Supabase Management API. */
export function runSql(query: string): Promise<Array<Record<string, unknown>>>
