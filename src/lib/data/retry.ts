/**
 * Runs a Supabase request up to `attempts` times, waiting a little longer
 * each time. A statement timeout under load (for example while a build
 * prerenders many pages at once) is usually gone a moment later.
 */
export async function withRetry<T extends { error: { message: string } | null }>(
  request: () => PromiseLike<T>,
  attempts = 3,
): Promise<T> {
  let result = await request()
  for (let attempt = 1; attempt < attempts && result.error; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 400 * attempt))
    result = await request()
  }
  return result
}
